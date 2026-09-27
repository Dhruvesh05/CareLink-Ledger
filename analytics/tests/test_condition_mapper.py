import pandas as pd
import pytest

from app.fhir.condition_mapper import ConditionMapper


def test_maps_condition_to_fhir_condition():
    row = pd.Series(
        {
            "patient_id": 101,
            "condition": "Hypertension",
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition.__resource_type__ == "Condition"
    assert condition.subject.reference == "Patient/101"
    assert condition.code.text == "Hypertension"


def test_maps_condition_with_code():
    row = pd.Series(
        {
            "patient_id": 101,
            "condition": "Hypertension",
            "condition_code": "I10",
            "condition_system": "http://hl7.org/fhir/sid/icd-10",
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition.code.text == "Hypertension"
    assert condition.code.coding[0].code == "I10"
    assert (
        condition.code.coding[0].system
        == "http://hl7.org/fhir/sid/icd-10"
    )


def test_maps_condition_status():
    row = pd.Series(
        {
            "patient_id": 101,
            "condition": "Diabetes",
            "condition_status": "resolved",
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition.clinicalStatus.coding[0].code == "resolved"


def test_returns_none_when_condition_missing():
    row = pd.Series(
        {
            "patient_id": 101,
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition is None


def test_requires_patient_id():
    row = pd.Series(
        {
            "condition": "Hypertension",
        }
    )

    with pytest.raises(ValueError, match="patient_id is required"):
        ConditionMapper().map_row(row)


def test_empty_condition_returns_none():
    row = pd.Series(
        {
            "patient_id": 101,
            "condition": "   ",
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition is None


def test_numeric_patient_id_does_not_get_decimal():
    row = pd.Series(
        {
            "patient_id": 101.0,
            "condition": "Hypertension",
        }
    )

    condition = ConditionMapper().map_row(row)

    assert condition.subject.reference == "Patient/101"