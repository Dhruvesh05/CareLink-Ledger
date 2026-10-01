import pandas as pd
import pytest

from app.fhir.patient_mapper import PatientMapper


def test_maps_required_patient_id():
    row = pd.Series(
        {
            "patient_id": 101,
        }
    )

    patient = PatientMapper().map_row(row)

    assert patient.__resource_type__ == "Patient"
    assert patient.id == "101"


def test_maps_patient_demographic_fields():
    row = pd.Series(
        {
            "patient_id": 101,
            "gender": "Female",
            "date_of_birth": "2000-05-15",
            "active": True,
        }
    )

    patient = PatientMapper().map_row(row)

    assert patient.id == "101"
    assert patient.gender == "female"
    assert str(patient.birthDate) == "2000-05-15"
    assert patient.active is True


def test_maps_string_boolean_values():
    row = pd.Series(
        {
            "patient_id": 101,
            "active": "false",
        }
    )

    patient = PatientMapper().map_row(row)

    assert patient.active is False


def test_maps_numeric_boolean_values():
    row = pd.Series(
        {
            "patient_id": 101,
            "active": 1,
        }
    )

    patient = PatientMapper().map_row(row)

    assert patient.active is True


def test_optional_fields_can_be_missing():
    row = pd.Series(
        {
            "patient_id": 101,
        }
    )

    patient = PatientMapper().map_row(row)

    assert patient.id == "101"
    assert patient.gender is None
    assert patient.birthDate is None
    assert patient.active is None


def test_patient_id_is_required():
    row = pd.Series(
        {
            "gender": "male",
        }
    )

    with pytest.raises(ValueError, match="patient_id is required"):
        PatientMapper().map_row(row)


def test_invalid_boolean_value_is_rejected():
    row = pd.Series(
        {
            "patient_id": 101,
            "active": "unknown-value",
        }
    )

    with pytest.raises(ValueError, match="Unable to convert"):
        PatientMapper().map_row(row)


def test_invalid_date_is_rejected():
    row = pd.Series(
        {
            "patient_id": 101,
            "date_of_birth": "not-a-date",
        }
    )

    with pytest.raises(ValueError):
        PatientMapper().map_row(row)