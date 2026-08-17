"""
Unit tests for MappingEngine.
"""

import pytest

from app.mapping.mapping_engine import MappingEngine
from app.models.schema_profile import SchemaProfile


@pytest.fixture
def engine():
    return MappingEngine()


def create_profile(
    columns,
    data_types,
):
    """
    Create a minimal SchemaProfile for mapping tests.
    """

    return SchemaProfile(
        dataset_name="hospital_a.csv",
        row_count=5,
        column_count=len(columns),
        columns=columns,
        data_types=data_types,
    )


def test_maps_exact_fields(engine):
    """
    Canonical field names should map directly.
    """

    profile = create_profile(
        columns=[
            "patient_id",
            "age",
            "gender",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
            "gender": "categorical",
        },
    )

    result = engine.map(profile)

    assert result.mapping_count == 3
    assert result.unmapped_source_fields == ()
    assert result.missing_required_fields == ()
    assert result.is_complete is True


def test_maps_hospital_aliases(engine):
    """
    Hospital-specific aliases should map to canonical fields.
    """

    profile = create_profile(
        columns=[
            "PatientID",
            "PatientAge",
            "Sex",
            "BodyWeight",
            "PrimaryDisease",
        ],
        data_types={
            "PatientID": "integer",
            "PatientAge": "decimal",
            "Sex": "categorical",
            "BodyWeight": "decimal",
            "PrimaryDisease": "string",
        },
    )

    result = engine.map(profile)

    assert result.mapping_count == 5
    assert result.unmapped_source_fields == ()
    assert result.missing_required_fields == ()

    mappings = {
        mapping.source_field: mapping.canonical_field
        for mapping in result.mappings
    }

    assert mappings["PatientID"] == "patient_id"
    assert mappings["PatientAge"] == "age"
    assert mappings["Sex"] == "gender"
    assert mappings["BodyWeight"] == "weight"
    assert mappings["PrimaryDisease"] == "diagnosis"


def test_identifies_unmapped_fields(engine):
    """
    Fields without a reliable canonical mapping should be reported.
    """

    profile = create_profile(
        columns=[
            "PatientID",
            "EmergencyContact",
        ],
        data_types={
            "PatientID": "integer",
            "EmergencyContact": "string",
        },
    )

    result = engine.map(profile)

    assert result.mapping_count == 1
    assert result.unmapped_source_fields == (
        "EmergencyContact",
    )


def test_identifies_missing_required_fields(engine):
    """
    Missing required canonical fields should be reported.
    """

    profile = create_profile(
        columns=[
            "PatientAge",
            "Sex",
        ],
        data_types={
            "PatientAge": "integer",
            "Sex": "categorical",
        },
    )

    result = engine.map(profile)

    assert result.missing_required_fields == (
        "patient_id",
    )

    assert result.is_complete is False


def test_complete_mapping(engine):
    """
    A dataset containing all required fields and no unmapped
    fields should produce a complete result.
    """

    profile = create_profile(
        columns=[
            "PatientID",
        ],
        data_types={
            "PatientID": "integer",
        },
    )

    result = engine.map(profile)

    assert result.is_complete is True
    assert result.mapping_count == 1


def test_empty_dataset(engine):
    """
    An empty schema should produce no mappings and should report
    the required patient_id field as missing.
    """

    profile = create_profile(
        columns=[],
        data_types={},
    )

    result = engine.map(profile)

    assert result.mapping_count == 0
    assert result.unmapped_source_fields == ()
    assert result.missing_required_fields == (
        "patient_id",
    )


def test_invalid_profile_is_rejected(engine):
    """
    MappingEngine must reject invalid input.
    """

    with pytest.raises(TypeError):
        engine.map("not-a-schema-profile")