import pandas as pd

from app.ingestion.ingestion_service import IngestionService
from app.services.schema_service import SchemaService


def test_ingestion_to_schema_analysis():
    """
    Verify the complete ingestion-to-schema-analysis pipeline.
    """

    # Step 1: Load the dataset through the ingestion layer
    ingestion_service = IngestionService()

    dataframe = ingestion_service.load(
        "test_data/sample.csv"
    )

    # Step 2: Verify ingestion produced a DataFrame
    assert isinstance(dataframe, pd.DataFrame)
    assert not dataframe.empty

    # Step 3: Analyze the ingested dataset
    schema_service = SchemaService()

    profile = schema_service.analyze_dataset(
        dataframe,
        "sample.csv",
    )

    # Step 4: Verify SchemaProfile was generated
    assert profile is not None

    # Step 5: Verify dataset metadata
    assert profile.dataset_name == "sample.csv"
    assert profile.row_count == len(dataframe)

    # Step 6: Verify datatype detection
    assert profile.data_types is not None
    assert len(profile.data_types) > 0

    # Step 7: Verify metadata extraction
    assert profile.missing_values is not None

    # Step 8: Verify fingerprint generation
    assert profile.fingerprint is not None
    assert len(profile.fingerprint) == 64