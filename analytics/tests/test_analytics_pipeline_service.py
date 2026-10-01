"""
Integration tests for the analytics pipeline service.
"""

import pandas as pd

from app.services.analytics_pipeline_service import AnalyticsPipelineService


def test_pipeline_transforms_and_validates_hospital_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2, 3],
            "PatientAge": [25, 40, 60],
            "Sex": ["male", "female", "other"],
            "BodyWeight": [65.5, 58.0, 72.3],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(dataframe)

    canonical_dataframe = result["canonical_dataframe"]
    validation_result = result["validation_result"]
    mapping_result = result["mapping_result"]

    assert "patient_id" in canonical_dataframe.columns
    assert "age" in canonical_dataframe.columns
    assert "gender" in canonical_dataframe.columns
    assert "weight" in canonical_dataframe.columns

    assert "PatientID" not in canonical_dataframe.columns
    assert "PatientAge" not in canonical_dataframe.columns
    assert "Sex" not in canonical_dataframe.columns
    assert "BodyWeight" not in canonical_dataframe.columns

    assert mapping_result.mapping_count == 4

    assert validation_result.total_rows == 3
    assert validation_result.valid_rows == 3
    assert validation_result.invalid_rows == 0
    assert validation_result.quality_score == 100.0
    assert validation_result.is_valid


def test_pipeline_preserves_unmapped_columns():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
            "EmergencyContact": ["1111111111", "2222222222"],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(dataframe)

    canonical_dataframe = result["canonical_dataframe"]

    assert "patient_id" in canonical_dataframe.columns
    assert "age" in canonical_dataframe.columns
    assert "gender" in canonical_dataframe.columns
    assert "EmergencyContact" in canonical_dataframe.columns


def test_pipeline_detects_invalid_canonical_data():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(dataframe)

    validation_result = result["validation_result"]

    assert validation_result.total_rows == 2
    assert validation_result.invalid_rows == 1
    assert validation_result.valid_rows == 1
    assert validation_result.quality_score == 50.0
    assert not validation_result.is_valid

def test_pipeline_generates_fhir_bundle_for_valid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
            "BodyWeight": [65.5, 58.0],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(dataframe)

    fhir_bundle = result["fhir_bundle"]

    assert fhir_bundle is not None
    assert fhir_bundle.__resource_type__ == "Bundle"
    assert fhir_bundle.type == "collection"

    assert len(fhir_bundle.entry) == 4

    resource_types = [
        entry.resource.__resource_type__
        for entry in fhir_bundle.entry
    ]

    assert resource_types == [
        "Patient",
        "Observation",
        "Patient",
        "Observation",
    ]

def test_pipeline_does_not_generate_fhir_bundle_for_invalid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(dataframe)

    validation_result = result["validation_result"]

    assert not validation_result.is_valid
    assert result["fhir_bundle"] is None

def test_pipeline_generates_processing_metadata_for_valid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
            "BodyWeight": [65.5, 58.0],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(
        dataframe,
        dataset_name="hospital_a.csv",
    )

    metadata = result["processing_metadata"]

    assert metadata.dataset_name == "hospital_a.csv"
    assert metadata.status == "FHIR_GENERATED"
    assert metadata.row_count == 2
    assert metadata.column_count == 4
    assert metadata.mapping_count == 4
    assert metadata.quality_score == 100.0
    assert metadata.fhir_resource_count == 4
    assert metadata.schema_fingerprint


def test_pipeline_generates_error_status_for_invalid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(
        dataframe,
        dataset_name="invalid_hospital.csv",
    )

    metadata = result["processing_metadata"]

    assert metadata.dataset_name == "invalid_hospital.csv"
    assert metadata.status == "VALIDATED_WITH_ERRORS"
    assert metadata.row_count == 2
    assert metadata.quality_score == 50.0
    assert metadata.fhir_resource_count == 0

def test_pipeline_generates_analytics_metadata_for_valid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
            "BodyWeight": [65.5, 58.0],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(
        dataframe,
        dataset_name="metadata_test.csv",
    )

    metadata = result["metadata"]

    assert metadata is not None

    assert metadata.dataset_name == "metadata_test.csv"
    assert metadata.row_count == 2
    assert metadata.column_count == 4

    assert metadata.mapping_count == 4
    assert metadata.mapping_complete is True

    assert metadata.valid_rows == 2
    assert metadata.invalid_rows == 0
    assert metadata.quality_score == 100.0

    assert metadata.error_count == 0
    assert metadata.warning_count == 0
    assert metadata.quarantined_row_count == 0

    assert metadata.fhir_resource_count == 4
    assert metadata.fhir_resource_types == [
        "Observation",
        "Patient",
    ]


def test_pipeline_generates_metadata_for_invalid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    service = AnalyticsPipelineService()

    result = service.process(
        dataframe,
        dataset_name="invalid_metadata_test.csv",
    )

    metadata = result["metadata"]

    assert metadata is not None

    assert metadata.dataset_name == (
        "invalid_metadata_test.csv"
    )

    assert metadata.valid_rows == 1
    assert metadata.invalid_rows == 1
    assert metadata.quality_score == 50.0

    assert metadata.error_count > 0
    assert metadata.quarantined_row_count > 0

    assert metadata.fhir_resource_count == 0
    assert metadata.fhir_resource_types == []