"""
Orchestrates the analytics pipeline from raw ingestion
through schema analysis, mapping, canonical transformation,
validation, FHIR transformation, and metadata generation.
"""

from __future__ import annotations

import pandas as pd

from app.mapping.canonical_transformer import CanonicalTransformer
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
        fhir_service: FHIRTransformationService | None = None,
        metadata_service: AnalyticsMetadataService | None = None,
    ) -> None:
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
        self.fhir_service = (
            fhir_service or FHIRTransformationService()
        )
        self.metadata_service = (
            metadata_service or AnalyticsMetadataService()
        )

    def process(
        self,
        dataframe: pd.DataFrame,
        dataset_name: str = "pipeline_dataset",
    ) -> dict:
        """
        Process a raw hospital dataset through the complete
        analytics pipeline.
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

        if validation_result.is_valid:
            fhir_bundle = self.fhir_service.transform(
                canonical_dataframe
            )

        # ---------------------------------------------------------
        # 6. Determine processing status
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
        # 8. Return complete pipeline result
        # ---------------------------------------------------------
        return {
            "schema_profile": schema_profile,
            "mapping_result": mapping_result,
            "canonical_dataframe": canonical_dataframe,
            "validation_result": validation_result,
            "fhir_bundle": fhir_bundle,

            # Primary metadata output
            "processing_metadata": metadata,

            # Backward-compatible metadata alias
            "metadata": metadata,
        }