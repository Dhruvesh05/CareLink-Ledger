import pandas as pd
import pytest

from app.fhir.observation_mapper import ObservationMapper


def test_maps_weight_to_observation():
    row = pd.Series(
        {
            "patient_id": 101,
            "weight": 65.5,
        }
    )

    observation = ObservationMapper().map_row(row)

    assert observation.__resource_type__ == "Observation"
    assert observation.status == "final"
    assert observation.subject.reference == "Patient/101"

    assert observation.valueQuantity.value == 65.5
    assert observation.valueQuantity.unit == "kg"
    assert observation.valueQuantity.code == "kg"


def test_maps_integer_weight():
    row = pd.Series(
        {
            "patient_id": 101,
            "weight": 65,
        }
    )

    observation = ObservationMapper().map_row(row)

    assert observation.valueQuantity.value == 65.0


def test_maps_string_weight():
    row = pd.Series(
        {
            "patient_id": 101,
            "weight": "65.5",
        }
    )

    observation = ObservationMapper().map_row(row)

    assert observation.valueQuantity.value == 65.5


def test_returns_none_when_weight_is_missing():
    row = pd.Series(
        {
            "patient_id": 101,
            "weight": None,
        }
    )

    observation = ObservationMapper().map_row(row)

    assert observation is None


def test_requires_patient_id():
    row = pd.Series(
        {
            "weight": 65.5,
        }
    )

    with pytest.raises(ValueError, match="patient_id is required"):
        ObservationMapper().map_row(row)


def test_rejects_invalid_weight():
    row = pd.Series(
        {
            "patient_id": 101,
            "weight": "not-a-number",
        }
    )

    with pytest.raises(ValueError, match="Unable to convert"):
        ObservationMapper().map_row(row)