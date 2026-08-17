"""
Unit tests for SchemaDetector.
"""

import pytest

from app.mapping.schema_detector import SchemaDetector
from app.models.schema import Schema
from app.models.schema_profile import SchemaProfile
from app.registry.schema_registry import SchemaRegistry


@pytest.fixture
def registry():
    return SchemaRegistry()


@pytest.fixture
def detector(registry):
    return SchemaDetector(
        schema_registry=registry,
    )


def create_profile(
    columns,
    data_types,
    row_count=3,
):
    """
    Create a minimal SchemaProfile for testing.
    """

    return SchemaProfile(
        dataset_name="test.csv",
        row_count=row_count,
        column_count=len(columns),
        columns=columns,
        data_types=data_types,
    )


def create_schema(
    detector,
    profile,
    schema_id="schema-001",
):
    """
    Create a Schema object using the profile's schema fingerprint.
    """

    return Schema(
        schema_id=schema_id,
        hospital_id="hospital-001",
        schema_name="Hospital Patient Schema",
        fingerprint=detector.fingerprint(profile),
        mapping_version="v1",
    )


def test_detects_known_schema(
    detector,
    registry,
):
    """
    A registered schema must be detected and returned.
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

    schema = create_schema(
        detector,
        profile,
    )

    registry.register(schema)

    result = detector.detect(profile)

    assert result is schema


def test_detects_unknown_schema(
    detector,
):
    """
    An unregistered schema must return None.
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

    assert detector.detect(profile) is None


def test_same_schema_is_detected_as_known(
    detector,
    registry,
):
    """
    Structurally identical schemas must be recognized even when
    their dataset metadata differs.
    """

    registered_profile = create_profile(
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
        row_count=100,
    )

    incoming_profile = create_profile(
        columns=[
            "gender",
            "age",
            "patient_id",
        ],
        data_types={
            "gender": "categorical",
            "age": "integer",
            "patient_id": "integer",
        },
        row_count=500,
    )

    schema = create_schema(
        detector,
        registered_profile,
    )

    registry.register(schema)

    result = detector.detect(incoming_profile)

    assert result is schema


def test_different_schema_is_not_detected(
    detector,
    registry,
):
    """
    A structurally different schema must return None.
    """

    registered_profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    incoming_profile = create_profile(
        columns=[
            "patient_id",
            "diagnosis",
        ],
        data_types={
            "patient_id": "integer",
            "diagnosis": "string",
        },
    )

    schema = create_schema(
        detector,
        registered_profile,
    )

    registry.register(schema)

    assert detector.detect(incoming_profile) is None


def test_datatype_difference_is_detected_as_new_schema(
    detector,
    registry,
):
    """
    A datatype difference must result in a new schema.
    """

    registered_profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    incoming_profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "string",
        },
    )

    schema = create_schema(
        detector,
        registered_profile,
    )

    registry.register(schema)

    assert detector.detect(incoming_profile) is None


def test_empty_registry_returns_unknown(
    detector,
):
    """
    A schema must be unknown when the registry is empty.
    """

    profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    assert detector.detect(profile) is None


def test_invalid_profile_is_rejected(
    detector,
):
    """
    Detector must reject invalid profile input.
    """

    with pytest.raises(TypeError):
        detector.detect("not-a-profile")


def test_fingerprint_method_returns_string(
    detector,
):
    """
    The detector must expose a deterministic schema fingerprint.
    """

    profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    fingerprint = detector.fingerprint(profile)

    assert isinstance(fingerprint, str)
    assert len(fingerprint) == 64


def test_is_known_returns_true_for_registered_schema(
    detector,
    registry,
):
    """
    is_known() must return True for a registered schema.
    """

    profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    schema = create_schema(
        detector,
        profile,
    )

    registry.register(schema)

    assert detector.is_known(profile) is True


def test_is_known_returns_false_for_unknown_schema(
    detector,
):
    """
    is_known() must return False for an unregistered schema.
    """

    profile = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    assert detector.is_known(profile) is False