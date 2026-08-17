"""
Unit tests for the CareLink canonical schema.
"""

import pytest

from app.mapping.canonical_schema import (
    CANONICAL_FIELDS,
    CanonicalField,
    get_canonical_field,
    get_canonical_fields,
)


def test_canonical_fields_are_defined():
    """
    Verify that the expected canonical fields exist.
    """

    expected_fields = {
        "patient_id",
        "date_of_birth",
        "age",
        "gender",
        "weight",
        "active",
        "diagnosis",
        "hospital",
    }

    assert expected_fields.issubset(CANONICAL_FIELDS.keys())


def test_canonical_field_structure():
    """
    Verify that canonical fields use the expected structure.
    """

    patient_id = get_canonical_field("patient_id")

    assert isinstance(patient_id, CanonicalField)
    assert patient_id.name == "patient_id"
    assert patient_id.data_type == "integer"
    assert patient_id.required is True


def test_optional_fields_are_not_required():
    """
    Verify that non-identifier fields are currently optional.
    """

    assert get_canonical_field("age").required is False
    assert get_canonical_field("gender").required is False
    assert get_canonical_field("weight").required is False
    assert get_canonical_field("diagnosis").required is False


def test_aliases_are_defined():
    """
    Verify that common hospital-specific names are represented.
    """

    assert "sex" in get_canonical_field("gender").aliases
    assert "dob" in get_canonical_field("date_of_birth").aliases
    assert "bodyweight" in get_canonical_field("weight").aliases
    assert "patientage" in get_canonical_field("age").aliases


def test_get_canonical_fields_returns_copy():
    """
    Verify that retrieving all fields does not expose the original
    dictionary for direct modification.
    """

    fields = get_canonical_fields()

    assert fields is not CANONICAL_FIELDS
    assert fields == CANONICAL_FIELDS


def test_unknown_canonical_field_raises_error():
    """
    Verify that an unknown canonical field is rejected.
    """

    with pytest.raises(KeyError):
        get_canonical_field("unknown_field")