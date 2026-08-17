"""
Unit tests for MappingService.
"""

import pytest

from app.models.schema_profile import SchemaProfile
from app.services.mapping_service import MappingService


@pytest.fixture
def profile():
    return SchemaProfile(
        dataset_name="hospital_a.csv",
        row_count=5,
        column_count=3,
        columns=[
            "PatientID",
            "PatientAge",
            "Sex",
        ],
        data_types={
            "PatientID": "integer",
            "PatientAge": "decimal",
            "Sex": "categorical",
        },
    )


@pytest.fixture
def service():
    return MappingService()


def test_map_dataset_returns_mapping_result(
    service,
    profile,
):
    """
    Verify that mapping a dataset returns a MappingResult.
    """

    result = service.map_dataset(profile)

    assert result.mapping_count == 3
    assert result.unmapped_source_fields == ()
    assert result.missing_required_fields == ()


def test_map_and_register_stores_mappings(
    service,
    profile,
):
    """
    Verify that generated mappings are registered.
    """

    result = service.map_and_register(
        "schema-001",
        profile,
    )

    assert result.mapping_count == 3

    registered = service.mapping_registry.get_for_schema(
        "schema-001"
    )

    assert len(registered) == 3


def test_registered_mapping_can_be_retrieved(
    service,
    profile,
):
    """
    Verify that an individual mapping can be retrieved
    after registration.
    """

    service.map_and_register(
        "schema-001",
        profile,
    )

    mapping = service.mapping_registry.get(
        "schema-001",
        "PatientAge",
    )

    assert mapping is not None
    assert mapping.canonical_field == "age"


def test_unmapped_fields_are_not_registered(
    service,
):
    """
    Verify that fields without a valid canonical mapping
    are not stored in the registry.
    """

    profile = SchemaProfile(
        dataset_name="hospital_a.csv",
        row_count=5,
        column_count=2,
        columns=[
            "PatientID",
            "EmergencyContact",
        ],
        data_types={
            "PatientID": "integer",
            "EmergencyContact": "string",
        },
    )

    result = service.map_and_register(
        "schema-001",
        profile,
    )

    assert result.mapping_count == 1

    assert result.unmapped_source_fields == (
        "EmergencyContact",
    )

    assert (
        service.mapping_registry.get(
            "schema-001",
            "EmergencyContact",
        )
        is None
    )


def test_invalid_schema_id_is_rejected(
    service,
    profile,
):
    """
    Verify that an empty schema ID is rejected.
    """

    with pytest.raises(ValueError):
        service.map_and_register(
            "",
            profile,
        )


def test_invalid_profile_is_rejected(service):
    """
    Verify that invalid profiles are rejected.
    """

    with pytest.raises(TypeError):
        service.map_dataset(
            "invalid-profile"
        )

    with pytest.raises(TypeError):
        service.map_and_register(
            "schema-001",
            "invalid-profile",
        )