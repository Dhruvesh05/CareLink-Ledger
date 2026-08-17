"""
Unit tests for ColumnMatcher.
"""

import pytest

from app.mapping.column_matcher import ColumnMatcher
from app.models.mapping import FieldMapping


@pytest.fixture
def matcher():
    return ColumnMatcher()


def test_exact_match(matcher):
    """
    Exact canonical field names should receive maximum confidence.
    """

    result = matcher.match("patient_id")

    assert isinstance(result, FieldMapping)
    assert result.source_field == "patient_id"
    assert result.canonical_field == "patient_id"
    assert result.match_method == "exact"
    assert result.confidence == 1.0


def test_normalized_match(matcher):
    """
    Case and separator differences should be normalized.
    """

    result = matcher.match("Patient_ID")

    assert result is not None
    assert result.canonical_field == "patient_id"
    assert result.match_method == "normalized"
    assert result.confidence == 0.98


def test_normalized_match_with_spaces(matcher):
    """
    Spaces should be treated equivalently to underscores.
    """

    result = matcher.match("Patient ID")

    assert result is not None
    assert result.canonical_field == "patient_id"


def test_alias_match(matcher):
    """
    Known aliases should map to the canonical field.
    """

    result = matcher.match("Sex")

    assert result is not None
    assert result.canonical_field == "gender"
    assert result.match_method == "alias"
    assert result.confidence == 0.95


def test_alias_match_with_datatype_compatibility(matcher):
    """
    Datatype compatibility should increase confidence for a valid
    alias mapping.
    """

    result = matcher.match(
        "PatientAge",
        source_data_type="integer",
    )

    assert result is not None
    assert result.canonical_field == "age"
    assert result.match_method == "alias"
    assert result.confidence == 0.97


def test_integer_semantic_decimal_is_accepted(matcher):
    """
    Decimal representation should be accepted for an integer-semantic
    canonical field because Pandas may represent integer columns with
    missing values as decimals.
    """

    result = matcher.match(
        "PatientAge",
        source_data_type="decimal",
    )

    assert result is not None
    assert result.canonical_field == "age"
    assert result.confidence == 0.97


def test_unknown_field_returns_none(matcher):
    """
    Unknown fields should not be force-mapped.
    """

    result = matcher.match("completely_unknown_field")

    assert result is None


def test_empty_field_is_rejected(matcher):
    """
    Empty source field names are invalid.
    """

    with pytest.raises(ValueError):
        matcher.match("")


def test_non_string_field_is_rejected(matcher):
    """
    Source field names must be strings.
    """

    with pytest.raises(TypeError):
        matcher.match(123)


def test_date_alias_match(matcher):
    """
    DOB should map to date_of_birth.
    """

    result = matcher.match("DOB")

    assert result is not None
    assert result.canonical_field == "date_of_birth"
    assert result.match_method == "alias"


def test_weight_alias_match(matcher):
    """
    BodyWeight should map to weight.
    """

    result = matcher.match("BodyWeight")

    assert result is not None
    assert result.canonical_field == "weight"


def test_diagnosis_alias_match(matcher):
    """
    PrimaryDisease should map to diagnosis.
    """

    result = matcher.match("PrimaryDisease")

    assert result is not None
    assert result.canonical_field == "diagnosis"