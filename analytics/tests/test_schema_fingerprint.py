"""
Unit tests for SchemaFingerprint.
"""

import pandas as pd
import pytest

from app.models.schema_profile import SchemaProfile
from app.mapping.schema_fingerprint import SchemaFingerprint


@pytest.fixture
def fingerprint_generator():
    return SchemaFingerprint()


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


def test_generates_sha256_fingerprint(
    fingerprint_generator,
):
    """
    Verify that a schema fingerprint is generated as a
    hexadecimal SHA-256 string.
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

    fingerprint = fingerprint_generator.generate(profile)

    assert isinstance(fingerprint, str)
    assert len(fingerprint) == 64

    assert all(
        character in "0123456789abcdef"
        for character in fingerprint
    )


def test_same_schema_produces_same_fingerprint(
    fingerprint_generator,
):
    """
    Identical schemas must produce identical fingerprints.
    """

    profile_a = create_profile(
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

    profile_b = create_profile(
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

    assert (
        fingerprint_generator.generate(profile_a)
        == fingerprint_generator.generate(profile_b)
    )


def test_column_order_does_not_change_fingerprint(
    fingerprint_generator,
):
    """
    Column order must not affect schema identity.
    """

    profile_a = create_profile(
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

    profile_b = create_profile(
        columns=[
            "gender",
            "patient_id",
            "age",
        ],
        data_types={
            "gender": "categorical",
            "patient_id": "integer",
            "age": "integer",
        },
    )

    assert (
        fingerprint_generator.generate(profile_a)
        == fingerprint_generator.generate(profile_b)
    )


def test_row_count_does_not_change_fingerprint(
    fingerprint_generator,
):
    """
    Different numbers of records must not affect schema identity.
    """

    profile_a = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
        row_count=10,
    )

    profile_b = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
        row_count=1000,
    )

    assert (
        fingerprint_generator.generate(profile_a)
        == fingerprint_generator.generate(profile_b)
    )


def test_different_column_changes_fingerprint(
    fingerprint_generator,
):
    """
    Adding or removing a structural field must change the fingerprint.
    """

    profile_a = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    profile_b = create_profile(
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

    assert (
        fingerprint_generator.generate(profile_a)
        != fingerprint_generator.generate(profile_b)
    )


def test_different_datatype_changes_fingerprint(
    fingerprint_generator,
):
    """
    A datatype change must produce a different schema fingerprint.
    """

    profile_a = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
    )

    profile_b = create_profile(
        columns=[
            "patient_id",
            "age",
        ],
        data_types={
            "patient_id": "integer",
            "age": "string",
        },
    )

    assert (
        fingerprint_generator.generate(profile_a)
        != fingerprint_generator.generate(profile_b)
    )


def test_dataset_values_do_not_affect_schema_fingerprint(
    fingerprint_generator,
):
    """
    Different patient records with the same schema must produce the
    same schema fingerprint.
    """

    dataframe_a = pd.DataFrame(
        {
            "patient_id": [1001, 1002],
            "age": [25, 31],
        }
    )

    dataframe_b = pd.DataFrame(
        {
            "patient_id": [5001, 5002, 5003],
            "age": [42, 55, 29],
        }
    )

    profile_a = create_profile(
        columns=list(dataframe_a.columns),
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
        row_count=len(dataframe_a),
    )

    profile_b = create_profile(
        columns=list(dataframe_b.columns),
        data_types={
            "patient_id": "integer",
            "age": "integer",
        },
        row_count=len(dataframe_b),
    )

    assert (
        fingerprint_generator.generate(profile_a)
        == fingerprint_generator.generate(profile_b)
    )


def test_invalid_input_is_rejected(
    fingerprint_generator,
):
    """
    SchemaFingerprint must reject objects that are not SchemaProfile.
    """

    with pytest.raises(TypeError):
        fingerprint_generator.generate("not a schema profile")