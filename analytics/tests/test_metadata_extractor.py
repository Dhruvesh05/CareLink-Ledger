import pandas as pd
import pytest

from app.schemas.metadata_extractor import MetadataExtractor


@pytest.fixture
def extractor():
    return MetadataExtractor()


def test_extract_basic_metadata(extractor):
    dataframe = pd.DataFrame({
        "patient_id": [1, 2, 3],
        "age": [20, 30, 40],
    })

    result = extractor.extract(dataframe)

    assert result["row_count"] == 3
    assert result["column_count"] == 2
    assert result["columns"] == ["patient_id", "age"]


def test_missing_values(extractor):
    dataframe = pd.DataFrame({
        "age": [20, None, 40],
        "gender": ["Male", "Female", None],
    })

    result = extractor.extract(dataframe)

    assert result["missing_values"]["age"] == 1
    assert result["missing_values"]["gender"] == 1


def test_missing_percentages(extractor):
    dataframe = pd.DataFrame({
        "age": [20, None, 40, None],
    })

    result = extractor.extract(dataframe)

    assert result["missing_percentages"]["age"] == 50.0


def test_unique_values(extractor):
    dataframe = pd.DataFrame({
        "gender": ["Male", "Female", "Male"]
    })

    result = extractor.extract(dataframe)

    assert result["unique_values"]["gender"] == 2


def test_duplicate_rows(extractor):
    dataframe = pd.DataFrame({
        "patient_id": [1, 2, 2, 3]
    })

    result = extractor.extract(dataframe)

    assert result["duplicate_rows"] == 1


def test_empty_dataframe(extractor):
    dataframe = pd.DataFrame({
        "patient_id": []
    })

    result = extractor.extract(dataframe)

    assert result["row_count"] == 0
    assert result["column_count"] == 1
    assert result["missing_percentages"]["patient_id"] == 0.0


def test_invalid_input(extractor):
    with pytest.raises(TypeError):
        extractor.extract("not a dataframe")