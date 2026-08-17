"""
Unit tests for SchemaRegistry.
"""

from datetime import datetime

import pytest

from app.models.schema import Schema
from app.registry.schema_registry import SchemaRegistry


@pytest.fixture
def registry():
    return SchemaRegistry()


@pytest.fixture
def schema():
    return Schema(
        schema_id="schema-001",
        hospital_id="hospital-001",
        schema_name="Hospital A Patient Schema",
        fingerprint="fingerprint-abc",
        mapping_version="v1",
        created_at=datetime.utcnow(),
    )


def test_register_schema(registry, schema):
    """
    A schema should be successfully registered.
    """

    registry.register(schema)

    assert registry.count() == 1
    assert registry.exists("schema-001")


def test_get_schema(registry, schema):
    """
    A registered schema should be retrievable by schema ID.
    """

    registry.register(schema)

    result = registry.get("schema-001")

    assert result is schema


def test_get_missing_schema_returns_none(registry):
    """
    Missing schema IDs should return None.
    """

    assert registry.get("unknown-schema") is None


def test_duplicate_schema_id_is_rejected(
    registry,
    schema,
):
    """
    Registering two schemas with the same schema ID should fail.
    """

    registry.register(schema)

    duplicate = Schema(
        schema_id="schema-001",
        hospital_id="hospital-002",
        schema_name="Hospital B Schema",
        fingerprint="fingerprint-xyz",
        mapping_version="v1",
    )

    with pytest.raises(ValueError):
        registry.register(duplicate)


def test_get_by_fingerprint(
    registry,
    schema,
):
    """
    A schema should be retrievable using its fingerprint.
    """

    registry.register(schema)

    result = registry.get_by_fingerprint(
        "fingerprint-abc"
    )

    assert result is schema


def test_missing_fingerprint_returns_none(
    registry,
    schema,
):
    """
    An unknown fingerprint should return None.
    """

    registry.register(schema)

    result = registry.get_by_fingerprint(
        "unknown-fingerprint"
    )

    assert result is None


def test_exists_by_fingerprint(
    registry,
    schema,
):
    """
    Fingerprint existence should be correctly detected.
    """

    registry.register(schema)

    assert registry.exists_by_fingerprint(
        "fingerprint-abc"
    ) is True

    assert registry.exists_by_fingerprint(
        "fingerprint-xyz"
    ) is False


def test_remove_schema(
    registry,
    schema,
):
    """
    A registered schema should be removable.
    """

    registry.register(schema)

    assert registry.exists("schema-001")

    registry.remove("schema-001")

    assert not registry.exists("schema-001")
    assert registry.count() == 0


def test_list_all_schemas(
    registry,
):
    """
    list_all should return every registered schema.
    """

    schema_a = Schema(
        schema_id="schema-001",
        hospital_id="hospital-001",
        schema_name="Hospital A",
        fingerprint="fingerprint-a",
        mapping_version="v1",
    )

    schema_b = Schema(
        schema_id="schema-002",
        hospital_id="hospital-002",
        schema_name="Hospital B",
        fingerprint="fingerprint-b",
        mapping_version="v1",
    )

    registry.register(schema_a)
    registry.register(schema_b)

    schemas = registry.list_all()

    assert len(schemas) == 2
    assert schema_a in schemas
    assert schema_b in schemas


def test_count(
    registry,
    schema,
):
    """
    Registry count should reflect the number of schemas.
    """

    assert registry.count() == 0

    registry.register(schema)

    assert registry.count() == 1