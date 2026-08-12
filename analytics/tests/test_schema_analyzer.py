import pandas as pd
import pytest

from app.models.schema_profile import SchemaProfile
from app.schemas.schema_analyzer import SchemaAnalyzer


@pytest.fixture
def analyzer():
    return SchemaAnalyzer()


@pytest.fixture
def dataframe():
    return pd.DataFrame({
        "patient_id": [1001, 1002, 1003, 1004],
        "age": [25, 35, None, 55],
        "gender": ["Male", "Female", "Male", "Female"],
        "diagnosis": [
            "Asthma",
            "Diabetes",
            "Asthma",
            "Hypertension",
        ],
    })


def test_analyzer_returns_schema_profile(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert isinstance(profile, SchemaProfile)


def test_analyzer_dataset_metadata(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.dataset_name == "hospital_a.csv"
    assert profile.row_count == 4
    assert profile.column_count == 4


def test_analyzer_detects_datatypes(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.data_types["patient_id"] == "integer"
    assert profile.data_types["age"] == "integer"
    assert profile.data_types["gender"] == "categorical"


def test_analyzer_extracts_missing_values(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.missing_values["age"] == 1


def test_analyzer_detects_primary_key(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert "patient_id" in profile.potential_primary_keys


def test_analyzer_generates_fingerprint(
    analyzer,
    dataframe,
):
    profile = analyzer.analyze(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.fingerprint is not None
    assert len(profile.fingerprint) == 64


def test_empty_dataset_name_raises_error(
    analyzer,
    dataframe,
):
    with pytest.raises(ValueError):
        analyzer.analyze(dataframe, "")


def test_invalid_dataframe_raises_error(analyzer):
    with pytest.raises(TypeError):
        analyzer.analyze(
            "not a dataframe",
            "test.csv",
        )