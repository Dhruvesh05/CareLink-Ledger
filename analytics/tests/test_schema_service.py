import pandas as pd
import pytest

from app.models.schema_profile import SchemaProfile
from app.schemas.schema_analyzer import SchemaAnalyzer
from app.services.schema_service import SchemaService


@pytest.fixture
def dataframe():
    return pd.DataFrame({
        "patient_id": [1001, 1002, 1003],
        "age": [25, 35, 45],
        "gender": ["Male", "Female", "Male"],
    })


def test_service_creates_default_analyzer():
    service = SchemaService()

    assert isinstance(
        service.analyzer,
        SchemaAnalyzer,
    )


def test_service_returns_schema_profile(dataframe):
    service = SchemaService()

    profile = service.analyze_dataset(
        dataframe,
        "hospital_a.csv",
    )

    assert isinstance(profile, SchemaProfile)


def test_service_returns_correct_dataset_name(dataframe):
    service = SchemaService()

    profile = service.analyze_dataset(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.dataset_name == "hospital_a.csv"


def test_service_returns_correct_row_count(dataframe):
    service = SchemaService()

    profile = service.analyze_dataset(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.row_count == 3


def test_service_produces_fingerprint(dataframe):
    service = SchemaService()

    profile = service.analyze_dataset(
        dataframe,
        "hospital_a.csv",
    )

    assert profile.fingerprint is not None
    assert len(profile.fingerprint) == 64


def test_service_rejects_invalid_dataframe():
    service = SchemaService()

    with pytest.raises(TypeError):
        service.analyze_dataset(
            "invalid",
            "test.csv",
        )