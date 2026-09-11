from __future__ import annotations

import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.ingestion.ingestion_service import IngestionService
from app.services.mapping_service import MappingService
from app.services.schema_service import SchemaService


router = APIRouter(prefix="/analytics", tags=["Analytics"])

_ingestion_service = IngestionService()
_schema_service = SchemaService()
_mapping_service = MappingService()


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
        "duplicate_rows": profile.duplicate_rows,
        "potential_primary_keys": profile.potential_primary_keys,
        "statistics": profile.statistics,
        "fingerprint": profile.fingerprint,
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


async def _save_upload(upload: UploadFile) -> str:
    suffix = os.path.splitext(upload.filename or "")[1].lower()

    if suffix not in {".csv", ".xlsx", ".xls", ".json"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported dataset format. Use CSV, XLSX, XLS, or JSON.",
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
    temp_path = await _save_upload(file)

    try:
        dataframe = _ingestion_service.load(temp_path)

        profile = _schema_service.analyze_dataset(
            dataframe,
            file.filename or "uploaded_dataset",
        )

        return _serialize_profile(profile)

    except (FileNotFoundError, ValueError, TypeError) as exc:
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

    except (FileNotFoundError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
