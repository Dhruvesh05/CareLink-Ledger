import pandas as pd
import pytest

from app.schemas.fingerprint_generator import FingerprintGenerator


@pytest.fixture
def generator():
    return FingerprintGenerator()


@pytest.fixture
def dataframe():
    return pd.DataFrame({
        "patient_id": [1, 2, 3],
        "age": [20, 30, 40],
    })


def test_generates_sha256_fingerprint(generator, dataframe):
    fingerprint = generator.generate(dataframe)

    assert isinstance(fingerprint, str)
    assert len(fingerprint) == 64

    int(fingerprint, 16)


def test_same_dataset_produces_same_fingerprint(
    generator,
    dataframe,
):
    fingerprint_1 = generator.generate(dataframe)
    fingerprint_2 = generator.generate(dataframe)

    assert fingerprint_1 == fingerprint_2


def test_modified_dataset_changes_fingerprint(
    generator,
    dataframe,
):
    fingerprint_1 = generator.generate(dataframe)

    modified = dataframe.copy()
    modified.loc[0, "age"] = 99

    fingerprint_2 = generator.generate(modified)

    assert fingerprint_1 != fingerprint_2


def test_column_order_does_not_change_fingerprint(
    generator,
    dataframe,
):
    reordered = dataframe[
        ["age", "patient_id"]
    ]

    assert (
        generator.generate(dataframe)
        == generator.generate(reordered)
    )


def test_invalid_input(generator):
    with pytest.raises(TypeError):
        generator.generate("not a dataframe")