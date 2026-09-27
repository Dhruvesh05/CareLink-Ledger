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