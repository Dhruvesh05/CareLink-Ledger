from __future__ import annotations

import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.ingestion.ingestion_service import IngestionService
from app.mapping.schema_detector import SchemaDetector
from app.registry.schema_registry import SchemaRegistry
from app.schemas.analytics_handoff import AnalyticsHandoffV1
from app.services.analytics_pipeline_service import AnalyticsPipelineService
from app.services.mapping_service import MappingService
from app.services.schema_service import SchemaService


router = APIRouter(prefix="/analytics", tags=["Analytics"])


_ingestion_service = IngestionService()
_schema_service = SchemaService()
_mapping_service = MappingService()
_schema_registry = SchemaRegistry()
_pipeline_service = AnalyticsPipelineService(
    schema_detector=SchemaDetector(schema_registry=_schema_registry),
)


def _serialize_profile(profile):
    return {
        "dataset_name": profile.dataset_name,
        "row_count": profile.row_count,
        "column_count": profile.column_count,
        "columns": profile.columns,
        "data_types": profile.data_types,
        "missing_values": profile.missing_values,
        "missing_percentages": profile.missing_percentages,
        "unique_values": profile.unique_values,
        "potential_primary_keys": profile.potential_primary_keys,
        "statistics": profile.statistics,
        "fingerprint": profile.fingerprint,
        "schema_version": profile.schema_version,
    }


def _serialize_mapping_result(result):
    return {
        "mappings": [
            {
                "source_field": mapping.source_field,
                "canonical_field": mapping.canonical_field,
                "match_method": mapping.match_method,
                "confidence": mapping.confidence,
            }
            for mapping in result.mappings
        ],
        "unmapped_source_fields": list(
            result.unmapped_source_fields
        ),
        "missing_required_fields": list(
            result.missing_required_fields
        ),
        "is_complete": result.is_complete,
        "mapping_count": result.mapping_count,
    }


def _serialize_validation_result(result):
    return {
        "is_valid": result.is_valid,
        "total_rows": result.total_rows,
        "valid_rows": result.valid_rows,
        "invalid_rows": result.invalid_rows,
        "quality_score": result.quality_score,
        "quarantined_rows": result.quarantined_rows,
        "errors": [
            {
                "field": error.field,
                "row": error.row,
                "code": error.code,
                "message": error.message,
                "value": error.value,
            }
            for error in result.errors
        ],
        "warnings": [
            {
                "field": warning.field,
                "row": warning.row,
                "code": warning.code,
                "message": warning.message,
                "value": warning.value,
            }
            for warning in result.warnings
        ],
    }



def _serialize_fhir_bundle(fhir_bundle):
    """
    Convert a single FHIR Bundle into JSON-compatible data.
    """
    if fhir_bundle is None:
        return None

    return fhir_bundle.model_dump(
        mode="json",
        exclude_none=True,
    )


def _serialize_fhir_bundles(fhir_bundles):
    """
    Serialize patient-level FHIR Bundles keyed by patient ID.
    """
    if not fhir_bundles:
        return None

    return {
        patient_id: _serialize_fhir_bundle(bundle)
        for patient_id, bundle in fhir_bundles.items()
    }


def _serialize_handoffs(handoffs):
    """Serialize versioned patient handoff payloads into JSON-compatible structure."""
    if not handoffs:
        return None

    serialized = {}
    for patient_id, handoff in handoffs.items():
        if isinstance(handoff, AnalyticsHandoffV1):
            serialized[patient_id] = handoff.model_dump(
                mode="json",
                by_alias=True,
                exclude_none=True,
            )
        elif isinstance(handoff, dict):
            serialized[patient_id] = {
                key: value for key, value in handoff.items()
            }
        else:
            serialized[patient_id] = handoff
    return serialized


async def _save_upload(upload: UploadFile) -> str:
    """
    Save an uploaded dataset to a temporary file.

    Supported formats:
        CSV
        XLSX
        XLS
        JSON
    """
    suffix = os.path.splitext(
        upload.filename or ""
    )[1].lower()

    if suffix not in {
        ".csv",
        ".xlsx",
        ".xls",
        ".json",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported dataset format. "
                "Use CSV, XLSX, XLS, or JSON."
            ),
        )

    content = await upload.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded dataset is empty.",
        )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_file:
        temp_file.write(content)
        return temp_file.name


@router.post("/analyze")
async def analyze_dataset(
    file: UploadFile = File(...),
):
    """
    Run the complete Analytics Layer pipeline.

    Pipeline:

        Upload
          ↓
        Ingestion
          ↓
        Schema Analysis
          ↓
        Schema Mapping
          ↓
        Canonical Transformation
          ↓
        Validation
          ↓
        FHIR Transformation
    """
    temp_path = await _save_upload(file)

    try:
        dataframe = _ingestion_service.load(temp_path)

        result = _pipeline_service.process(
            dataframe,
            dataset_name=file.filename or "uploaded_dataset",
            source_format={
                ".csv": "CSV",
                ".xlsx": "XLSX",
                ".xls": "XLS",
                ".json": "JSON",
            }.get(os.path.splitext(file.filename or "")[1].lower()),
        )

        profile = result["schema_profile"]
        mapping = result["mapping_result"]
        validation = result["validation_result"]
        fhir_bundle = result["fhir_bundle"]
        fhir_bundles = result.get("fhir_bundles")
        handoffs = result.get("handoffs")

        return {
            "schema": _serialize_profile(profile),
            "mapping": _serialize_mapping_result(mapping),
            "validation": _serialize_validation_result(validation),
            "fhir": _serialize_fhir_bundle(fhir_bundle),
            "fhir_bundles": _serialize_fhir_bundles(fhir_bundles),
            "handoffs": _serialize_handoffs(handoffs),
        }

    except (
        FileNotFoundError,
        ValueError,
        TypeError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/map")
async def map_dataset(
    file: UploadFile = File(...),
):
    """
    Analyze a dataset and return its schema-to-canonical
    field mappings without running the complete pipeline.
    """
    temp_path = await _save_upload(file)

    try:
        dataframe = _ingestion_service.load(temp_path)

        profile = _schema_service.analyze_dataset(
            dataframe,
            file.filename or "uploaded_dataset",
        )

        result = _mapping_service.map_dataset(profile)

        return {
            "dataset_name": profile.dataset_name,
            "schema": _serialize_profile(profile),
            "mapping": _serialize_mapping_result(result),
        }

    except (
        FileNotFoundError,
        ValueError,
        TypeError,
    ) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)