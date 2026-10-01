from datetime import datetime, timezone

import pytest

from app.models.processing_metadata import ProcessingMetadata


def test_processing_metadata_creation():
    metadata = ProcessingMetadata.create(
        dataset_name="hospital_a.csv",
        status="FHIR_GENERATED",
        row_count=3,
        column_count=4,
        schema_fingerprint="abc123",
        mapping_count=4,
        quality_score=100.0,
        fhir_resource_count=6,
    )

    assert metadata.dataset_name == "hospital_a.csv"
    assert metadata.status == "FHIR_GENERATED"
    assert metadata.row_count == 3
    assert metadata.column_count == 4
    assert metadata.schema_fingerprint == "abc123"
    assert metadata.mapping_count == 4
    assert metadata.quality_score == 100.0
    assert metadata.fhir_resource_count == 6
    assert metadata.processed_at.tzinfo is not None


def test_processing_metadata_rejects_negative_row_count():
    with pytest.raises(ValueError):
        ProcessingMetadata(
            dataset_name="hospital.csv",
            status="FHIR_GENERATED",
            processed_at=datetime.now(timezone.utc),
            row_count=-1,
            column_count=4,
            schema_fingerprint="abc123",
            mapping_count=4,
            quality_score=100.0,
            fhir_resource_count=4,
        )


def test_processing_metadata_rejects_invalid_quality_score():
    with pytest.raises(ValueError):
        ProcessingMetadata(
            dataset_name="hospital.csv",
            status="FHIR_GENERATED",
            processed_at=datetime.now(timezone.utc),
            row_count=3,
            column_count=4,
            schema_fingerprint="abc123",
            mapping_count=4,
            quality_score=101.0,
            fhir_resource_count=4,
        )