"""
Unit tests for MappingRegistry.
"""

import pytest

from app.models.mapping import FieldMapping
from app.registry.mapping_registry import MappingRegistry


@pytest.fixture
def registry():
    return MappingRegistry()


@pytest.fixture
def age_mapping():
    return FieldMapping(
        source_field="PatientAge",
        canonical_field="age",
        match_method="alias",
        confidence=0.95,
    )


@pytest.fixture
def gender_mapping():
    return FieldMapping(
        source_field="Sex",
        canonical_field="gender",
        match_method="alias",
        confidence=0.90,
    )


def test_register_mapping(registry, age_mapping):
    """
    Verify that a mapping can be registered.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    assert registry.get(
        "schema-001",
        "PatientAge",
    ) == age_mapping


def test_get_missing_mapping_returns_none(registry):
    """
    Verify that a missing mapping returns None.
    """

    assert registry.get(
        "schema-001",
        "PatientAge",
    ) is None


def test_duplicate_mapping_is_rejected(
    registry,
    age_mapping,
):
    """
    Verify that the same source field cannot be registered
    twice for the same schema.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    with pytest.raises(ValueError):
        registry.register(
            "schema-001",
            age_mapping,
        )


def test_same_source_field_allowed_for_different_schemas(
    registry,
    age_mapping,
):
    """
    The same hospital field name may legitimately occur in
    different schemas.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    registry.register(
        "schema-002",
        age_mapping,
    )

    assert registry.count() == 2


def test_exists(
    registry,
    age_mapping,
):
    """
    Verify existence checking.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    assert registry.exists(
        "schema-001",
        "PatientAge",
    )

    assert not registry.exists(
        "schema-001",
        "UnknownField",
    )


def test_get_for_schema(
    registry,
    age_mapping,
    gender_mapping,
):
    """
    Verify retrieval of all mappings belonging to a schema.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    registry.register(
        "schema-001",
        gender_mapping,
    )

    mappings = registry.get_for_schema(
        "schema-001"
    )

    assert len(mappings) == 2
    assert age_mapping in mappings
    assert gender_mapping in mappings


def test_get_for_unknown_schema_returns_empty_list(
    registry,
):
    """
    Verify that an unknown schema has no mappings.
    """

    assert registry.get_for_schema(
        "unknown-schema"
    ) == []


def test_remove_mapping(
    registry,
    age_mapping,
):
    """
    Verify that a mapping can be removed.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    registry.remove(
        "schema-001",
        "PatientAge",
    )

    assert registry.get(
        "schema-001",
        "PatientAge",
    ) is None


def test_list_all(
    registry,
    age_mapping,
    gender_mapping,
):
    """
    Verify that all registered mappings can be retrieved.
    """

    registry.register(
        "schema-001",
        age_mapping,
    )

    registry.register(
        "schema-002",
        gender_mapping,
    )

    mappings = registry.list_all()

    assert len(mappings) == 2
    assert age_mapping in mappings
    assert gender_mapping in mappings


def test_count(
    registry,
    age_mapping,
    gender_mapping,
):
    """
    Verify mapping count.
    """

    assert registry.count() == 0

    registry.register(
        "schema-001",
        age_mapping,
    )

    assert registry.count() == 1

    registry.register(
        "schema-001",
        gender_mapping,
    )

    assert registry.count() == 2


def test_invalid_schema_id_is_rejected(
    registry,
    age_mapping,
):
    """
    Verify that an empty schema ID is rejected.
    """

    with pytest.raises(ValueError):
        registry.register(
            "",
            age_mapping,
        )


def test_invalid_mapping_is_rejected(registry):
    """
    Verify that only FieldMapping instances can be registered.
    """

    with pytest.raises(TypeError):
        registry.register(
            "schema-001",
            "not-a-mapping",
        )