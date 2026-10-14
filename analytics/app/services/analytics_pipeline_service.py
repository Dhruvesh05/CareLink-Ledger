
"""
Orchestrates the analytics pipeline from raw ingestion
through schema analysis, mapping, canonical transformation,
validation, FHIR transformation, and metadata generation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path

import pandas as pd

from app.fhir.patient_id import normalize_patient_id
from app.mapping.canonical_transformer import CanonicalTransformer
from app.mapping.schema_detector import SchemaDetector
from app.models.mapping_result import MappingResult
from app.schemas.analytics_handoff import AnalyticsHandoffV1
from app.schemas.schema_analyzer import SchemaAnalyzer
from app.services.mapping_service import MappingService
from app.services.analytics_metadata_service import AnalyticsMetadataService
from app.services.fhir_transformation_service import FHIRTransformationService
from app.validation.validation_service import ValidationService


class AnalyticsPipelineService:
    """
    Coordinates the core analytics-layer processing pipeline.

    Pipeline:
        Raw DataFrame
            -> Schema Analysis
            -> Schema Mapping
            -> Canonical Transformation
            -> Validation
            -> FHIR Transformation
            -> Analytics Metadata
    """

    def __init__(
        self,
        schema_analyzer: SchemaAnalyzer | None = None,
        mapping_service: MappingService | None = None,
        validation_service: ValidationService | None = None,
        transformer: CanonicalTransformer | None = None,
        fhir_transformation_service: FHIRTransformationService | None = None,
        metadata_service: AnalyticsMetadataService | None = None,
        schema_detector: SchemaDetector | None = None,
    ) -> None:
        """Initialize pipeline services, allowing dependency injection."""

        self.schema_analyzer = (
            schema_analyzer or SchemaAnalyzer()
        )

        self.mapping_service = (
            mapping_service or MappingService()
        )

        self.validation_service = (
            validation_service or ValidationService()
        )

        self.transformer = (
            transformer or CanonicalTransformer()
        )

        self.fhir_transformation_service = (
            fhir_transformation_service
            or FHIRTransformationService()
        )

        # Backward-compatible alias for existing callers.
        self.fhir_service = self.fhir_transformation_service

        self.metadata_service = (
            metadata_service or AnalyticsMetadataService()
        )
        self.schema_detector = schema_detector or SchemaDetector()

    @staticmethod
    def _resolve_source_patient_id(
        dataframe: pd.DataFrame,
        fhir_patient_id: str,
        source_patient_column: str = "patient_id",
    ) -> str:
        """Return the first source-system patient identifier for a normalized patient."""
        for _, row in dataframe.iterrows():
            raw_value = row.get(source_patient_column)
            try:
                normalized = normalize_patient_id(raw_value)
            except ValueError:
                continue
            if normalized == fhir_patient_id:
                candidate = str(raw_value).strip()
                if candidate:
                    return candidate
                return fhir_patient_id
        return fhir_patient_id

    @staticmethod
    def _stable_dataset_id(
        dataset_name: str,
        schema_fingerprint: str,
        dataframe: pd.DataFrame,
    ) -> str:
        """Identify the dataset contents while remaining stable on reprocessing."""
        content = pd.util.hash_pandas_object(
            dataframe,
            index=True,
        ).values.tobytes()
        seed = (
            f"{dataset_name}:{schema_fingerprint}:"
            f"{','.join(map(str, dataframe.columns))}:"
            f"{','.join(map(str, dataframe.dtypes))}:"
        ).encode("utf-8") + content
        return sha256(seed).hexdigest()

    @staticmethod
    def _stable_processing_id(dataset_id: str, processed_at: datetime) -> str:
        seed = f"{dataset_id}:{processed_at.isoformat()}".encode("utf-8")
        return sha256(seed).hexdigest()

    def _build_handoffs(
        self,
        dataframe: pd.DataFrame,
        schema_profile,
        validation_result,
        mapping_result,
        fhir_bundles: dict[str, object] | None,
        dataset_name: str,
        source_format: str | None,
        schema_version: str | None,
    ) -> dict[str, dict[str, object]]:
        """Build one validated handoff per patient when the dataset is valid."""
        if validation_result is None or not validation_result.is_valid:
            return {}

        if not fhir_bundles:
            return {}

        if not source_format:
            return {}
        if not schema_version:
            return {}

        processed_at = datetime.now(timezone.utc)
        dataset_id = self._stable_dataset_id(
            dataset_name,
            schema_profile.fingerprint,
            dataframe,
        )

        source_patient_column = next(
            (
                mapping.source_field
                for mapping in mapping_result.mappings
                if mapping.canonical_field == "patient_id"
            ),
            "patient_id",
        )
        mapping_complete = (
            isinstance(mapping_result, MappingResult)
            and not mapping_result.unmapped_source_fields
            and not mapping_result.missing_required_fields
        )

        handoffs: dict[str, dict[str, object]] = {}
        for patient_id, bundle in fhir_bundles.items():
            source_patient_id = self._resolve_source_patient_id(
                dataframe,
                patient_id,
                source_patient_column,
            )
            processing_id = self._stable_processing_id(
                dataset_id,
                processed_at,
            )
            handoff = AnalyticsHandoffV1.from_patient_bundle(
                source_patient_id=source_patient_id,
                fhir_patient_id=patient_id,
                bundle=bundle.model_dump(mode="json", exclude_none=True),
                processing_id=processing_id,
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                processed_at=processed_at,
                schema_fingerprint=schema_profile.fingerprint,
                schema_version=schema_version,
                validation_result=validation_result,
                source_format=source_format,
                mapping_complete=mapping_complete,
            )
            handoffs[patient_id] = handoff.model_dump(
                mode="json",
                by_alias=True,
                exclude_none=True,
            )
        return handoffs

    def process(
        self,
        dataframe: pd.DataFrame,
        dataset_name: str = "pipeline_dataset",
        source_format: str | None = None,
        schema_version: str | None = None,
    ) -> dict:
        """
        Process a raw hospital dataset through the complete
        analytics pipeline.

        Patient-level FHIR Bundles are generated only when
        dataset validation succeeds.

        Returns:
            A dictionary containing schema analysis, mapping,
            canonical data, validation results, FHIR outputs,
            and analytics metadata.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                "dataframe must be a pandas DataFrame."
            )

        # ---------------------------------------------------------
        # 1. Schema Analysis
        # ---------------------------------------------------------
        schema_profile = self.schema_analyzer.analyze(
            dataframe,
            dataset_name=dataset_name,
        )
        if schema_version is None:
            schema_version = self.schema_detector.resolve_schema_version(
                schema_profile
            )
        schema_profile.schema_version = schema_version

        if source_format is None:
            suffix = Path(dataset_name).suffix.lower()
            source_format = {
                ".csv": "CSV",
                ".xlsx": "XLSX",
                ".xls": "XLS",
                ".json": "JSON",
            }.get(suffix)

        # ---------------------------------------------------------
        # 2. Schema Mapping
        # ---------------------------------------------------------
        mapping_result = self.mapping_service.map_dataset(
            schema_profile
        )

        # ---------------------------------------------------------
        # 3. Canonical Transformation
        # ---------------------------------------------------------
        canonical_dataframe = self.transformer.transform(
            dataframe,
            mapping_result,
        )

        # ---------------------------------------------------------
        # 4. Validation
        # ---------------------------------------------------------
        validation_result = (
            self.validation_service.validate_dataset(
                canonical_dataframe,
                schema_profile,
            )
        )

        # ---------------------------------------------------------
        # 5. FHIR Transformation
        # ---------------------------------------------------------
        fhir_bundle = None
        fhir_bundles = None

        if validation_result.is_valid:
            # Legacy dataset-level Bundle.
            # Preserved for backward compatibility.
            fhir_bundle = (
                self.fhir_transformation_service.transform(
                    canonical_dataframe
                )
            )

            # Primary patient-level output:
            # one Bundle per normalized FHIR Patient ID.
            fhir_bundles = (
                self.fhir_transformation_service
                .transform_patient_bundles(
                    canonical_dataframe
                )
            )

        # ---------------------------------------------------------
        # 6. Determine Processing Status
        # ---------------------------------------------------------
        if not validation_result.is_valid:
            status = "VALIDATED_WITH_ERRORS"
        elif fhir_bundle is not None:
            status = "FHIR_GENERATED"
        else:
            status = "VALIDATED"

        # ---------------------------------------------------------
        # 7. Generate Analytics Metadata
        # ---------------------------------------------------------
        metadata = self.metadata_service.generate(
            schema_profile=schema_profile,
            mapping_result=mapping_result,
            validation_result=validation_result,
            fhir_bundle=fhir_bundle,
            status=status,
        )

        # ---------------------------------------------------------
        # 8. Build patient-level handoff payloads
        # ---------------------------------------------------------
        handoffs = self._build_handoffs(
            dataframe=dataframe,
            schema_profile=schema_profile,
            validation_result=validation_result,
            mapping_result=mapping_result,
            fhir_bundles=fhir_bundles,
            dataset_name=dataset_name,
            source_format=source_format,
            schema_version=schema_version
            or getattr(schema_profile, "schema_version", None),
        )

        # ---------------------------------------------------------
        # 9. Return Complete Pipeline Result
        # ---------------------------------------------------------
        return {
            "schema_profile": schema_profile,
            "mapping_result": mapping_result,
            "canonical_dataframe": canonical_dataframe,
            "validation_result": validation_result,

            # Backward-compatible dataset-level FHIR output.
            "fhir_bundle": fhir_bundle,

            # Patient-level FHIR output, keyed by FHIR Patient ID.
            "fhir_bundles": fhir_bundles,

            # Versioned patient-level handoff payloads.
            "handoffs": handoffs,
            "patient_handoffs": handoffs,

            # Primary metadata output.
            "processing_metadata": metadata,

            # Backward-compatible metadata alias.
            "metadata": metadata,
        }
