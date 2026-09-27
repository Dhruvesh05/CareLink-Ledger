"""
Unit tests for CanonicalTransformer.
"""

import pandas as pd
import pytest

from app.mapping.canonical_transformer import CanonicalTransformer
from app.models.mapping import FieldMapping
from app.models.mapping_result import MappingResult


@pytest.fixture
def transformer():
    return CanonicalTransformer()


def test_transforms_mapped_columns(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 30],
            "Sex": ["male", "female"],
        }
    )

    mapping_result = MappingResult(
        mappings=(
            FieldMapping(
                source_field="PatientID",
                canonical_field="patient_id",
                match_method="alias",
                confidence=0.97,
            ),
            FieldMapping(
                source_field="PatientAge",
                canonical_field="age",
                match_method="alias",
                confidence=0.97,
            ),
            FieldMapping(
                source_field="Sex",
                canonical_field="gender",
                match_method="alias",
                confidence=0.97,
            ),
        )
    )

    result = transformer.transform(dataframe, mapping_result)

    assert list(result.columns) == [
        "patient_id",
        "age",
        "gender",
    ]


def test_preserves_unmapped_columns(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1],
            "EmergencyContact": ["9999999999"],
        }
    )

    mapping_result = MappingResult(
        mappings=(
            FieldMapping(
                source_field="PatientID",
                canonical_field="patient_id",
                match_method="alias",
                confidence=0.97,
            ),
        ),
        unmapped_source_fields=("EmergencyContact",),
    )

    result = transformer.transform(dataframe, mapping_result)

    assert list(result.columns) == [
        "patient_id",
        "EmergencyContact",
    ]

    assert result["EmergencyContact"].tolist() == ["9999999999"]


def test_does_not_modify_original_dataframe(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
        }
    )

    mapping_result = MappingResult(
        mappings=(
            FieldMapping(
                source_field="PatientID",
                canonical_field="patient_id",
                match_method="alias",
                confidence=0.97,
            ),
        )
    )

    result = transformer.transform(dataframe, mapping_result)

    assert list(dataframe.columns) == ["PatientID"]
    assert list(result.columns) == ["patient_id"]


def test_empty_mapping_returns_copy(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1],
            "Sex": ["male"],
        }
    )

    result = transformer.transform(
        dataframe,
        MappingResult(),
    )

    assert list(result.columns) == [
        "PatientID",
        "Sex",
    ]
    assert result is not dataframe


def test_rejects_duplicate_canonical_targets(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1],
            "PatientNumber": [1],
        }
    )

    mapping_result = MappingResult(
        mappings=(
            FieldMapping(
                source_field="PatientID",
                canonical_field="patient_id",
                match_method="alias",
                confidence=0.97,
            ),
            FieldMapping(
                source_field="PatientNumber",
                canonical_field="patient_id",
                match_method="alias",
                confidence=0.95,
            ),
        )
    )

    with pytest.raises(
        ValueError,
        match="Multiple source fields map to canonical field",
    ):
        transformer.transform(dataframe, mapping_result)


def test_rejects_missing_source_column(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1],
        }
    )

    mapping_result = MappingResult(
        mappings=(
            FieldMapping(
                source_field="PatientAge",
                canonical_field="age",
                match_method="alias",
                confidence=0.97,
            ),
        )
    )

    with pytest.raises(
        ValueError,
        match="does not exist in the dataframe",
    ):
        transformer.transform(dataframe, mapping_result)


def test_rejects_invalid_dataframe(transformer):
    with pytest.raises(TypeError):
        transformer.transform(
            "not-a-dataframe",
            MappingResult(),
        )


def test_rejects_invalid_mapping_result(transformer):
    dataframe = pd.DataFrame(
        {
            "PatientID": [1],
        }
    )

    with pytest.raises(TypeError):
        transformer.transform(
            dataframe,
            "not-a-mapping-result",
        )
