import pandas as pd
import pytest

from app.schemas.datatype_detector import DataTypeDetector


@pytest.fixture
def detector():
    return DataTypeDetector()


def test_detect_basic_datatypes(detector):
    dataframe = pd.DataFrame({
        "integer_col": [1, 2, 3],
        "decimal_col": [1.5, 2.5, 3.5],
        "boolean_col": [True, False, True],
        "string_col": ["A", "B", "C"],
    })

    result = detector.detect(dataframe)

    assert result["integer_col"] == "integer"
    assert result["decimal_col"] == "decimal"
    assert result["boolean_col"] == "boolean"
    assert result["string_col"] == "string"


def test_detect_date(detector):
    dataframe = pd.DataFrame({
        "date_of_birth": [
            "2000-01-01",
            "1995-05-10",
            "1988-12-25",
        ]
    })

    result = detector.detect(dataframe)

    assert result["date_of_birth"] == "date"


def test_detect_categorical(detector):
    dataframe = pd.DataFrame({
        "gender": ["Male", "Female"] * 50
    })

    result = detector.detect(dataframe)

    assert result["gender"] == "categorical"


def test_detect_empty_column(detector):
    dataframe = pd.DataFrame({
        "unknown": [None, None, None]
    })

    result = detector.detect(dataframe)

    assert result["unknown"] == "unknown"


def test_invalid_input(detector):
    with pytest.raises(TypeError):
        detector.detect("not a dataframe")