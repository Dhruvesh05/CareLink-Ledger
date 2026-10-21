
import pytest

from app.fhir.patient_id import normalize_patient_id


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (101, "101"),
        (101.0, "101"),
        ("101", "101"),
        ("patient-001", "patient-001"),
        ("patient.alpha-2", "patient.alpha-2"),
    ],
)
def test_normalize_patient_id(value, expected):
    assert normalize_patient_id(value) == expected


@pytest.mark.parametrize(
    "value",
    [
        None,
        float("nan"),
        "",
        "   ",
        True,
        101.5,
        "patient/101",
        "patient 101",
        "x" * 65,
    ],
)
def test_reject_invalid_patient_id(value):
    with pytest.raises(ValueError):
        normalize_patient_id(value)
