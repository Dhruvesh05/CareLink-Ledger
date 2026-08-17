"""
Unit tests for the FieldMapping model.
"""

import pytest

from app.models.mapping import FieldMapping


def test_valid_field_mapping():
    """
    Verify that a valid field mapping can be created.
    """

    mapping = FieldMapping(
        source_field="PatientAge",
        canonical_field="age",
        match_method="alias",
        confidence=0.95,
    )

    assert mapping.source_field == "PatientAge"
    assert mapping.canonical_field == "age"
    assert mapping.match_method == "alias"
    assert mapping.confidence == 0.95


def test_exact_mapping():
    """
    Verify representation of an exact mapping.
    """

    mapping = FieldMapping(
        source_field="patient_id",
        canonical_field="patient_id",
        match_method="exact",
        confidence=1.0,
    )

    assert mapping.confidence == 1.0
    assert mapping.match_method == "exact"


def test_empty_source_field_is_rejected():
    """
    Verify that an empty source field is invalid.
    """

    with pytest.raises(ValueError):
        FieldMapping(
            source_field="",
            canonical_field="age",
            match_method="alias",
            confidence=0.95,
        )


def test_empty_canonical_field_is_rejected():
    """
    Verify that an empty canonical field is invalid.
    """

    with pytest.raises(ValueError):
        FieldMapping(
            source_field="PatientAge",
            canonical_field="",
            match_method="alias",
            confidence=0.95,
        )


def test_empty_match_method_is_rejected():
    """
    Verify that an empty matching method is invalid.
    """

    with pytest.raises(ValueError):
        FieldMapping(
            source_field="PatientAge",
            canonical_field="age",
            match_method="",
            confidence=0.95,
        )


@pytest.mark.parametrize(
    "confidence",
    [-0.01, 1.01, 2.0, -1.0],
)
def test_invalid_confidence_is_rejected(confidence):
    """
    Verify that confidence must be between 0.0 and 1.0.
    """

    with pytest.raises(ValueError):
        FieldMapping(
            source_field="PatientAge",
            canonical_field="age",
            match_method="alias",
            confidence=confidence,
        )


def test_boundary_confidence_values_are_valid():
    """
    Verify that 0.0 and 1.0 are valid confidence values.
    """

    low = FieldMapping(
        source_field="PatientAge",
        canonical_field="age",
        match_method="alias",
        confidence=0.0,
    )

    high = FieldMapping(
        source_field="PatientAge",
        canonical_field="age",
        match_method="alias",
        confidence=1.0,
    )

    assert low.confidence == 0.0
    assert high.confidence == 1.0


def test_field_mapping_is_immutable():
    """
    Verify that FieldMapping is immutable.
    """

    mapping = FieldMapping(
        source_field="PatientAge",
        canonical_field="age",
        match_method="alias",
        confidence=0.95,
    )

    with pytest.raises(AttributeError):
        mapping.confidence = 1.0