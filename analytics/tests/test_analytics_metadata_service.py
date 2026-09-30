import pandas as pd

from app.services.analytics_metadata_service import (
    AnalyticsMetadataService,
)
from app.services.analytics_pipeline_service import (
    AnalyticsPipelineService,
)


def test_builds_metadata_from_valid_pipeline_result():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
            "BodyWeight": [65.5, 58.0],
        }
    )

    pipeline = AnalyticsPipelineService()
    result = pipeline.process(dataframe, dataset_name="test.csv")

    service = AnalyticsMetadataService()
    metadata = service.build(result)

    assert metadata.dataset_name == "test.csv"
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


def test_builds_metadata_for_invalid_dataset():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    pipeline = AnalyticsPipelineService()
    result = pipeline.process(
        dataframe,
        dataset_name="invalid.csv",
    )

    service = AnalyticsMetadataService()
    metadata = service.build(result)

    assert metadata.dataset_name == "invalid.csv"

    assert metadata.valid_rows == 1
    assert metadata.invalid_rows == 1
    assert metadata.quality_score == 50.0

    assert metadata.error_count > 0
    assert metadata.quarantined_row_count > 0

    assert metadata.fhir_resource_count == 0
    assert metadata.fhir_resource_types == []