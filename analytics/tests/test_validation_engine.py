import pandas as pd
import pytest

from app.mapping.canonical_schema import CANONICAL_FIELDS
from app.models.schema_profile import SchemaProfile
from app.validation.validation_engine import ValidationEngine


@pytest.fixture
def engine():
    return ValidationEngine()


def make_profile(dataframe, data_types, potential_primary_keys=None):
    return SchemaProfile(
        dataset_name="test_dataset",
        row_count=len(dataframe),
        column_count=len(dataframe.columns),
        columns=list(dataframe.columns),
        data_types=data_types,
        potential_primary_keys=potential_primary_keys or [],
    )


class TestValidationEngine:
    def test_valid_dataset_produces_valid_result(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2, 3],
                "age": [25, 40, 60],
                "weight": [60.0, 70.0, 80.0],
                "gender": ["male", "female", "other"],
                "active": [True, False, True],
                "date_of_birth": [
                    "2001-01-01",
                    "1985-05-10",
                    "1990-03-20",
                ],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
                "weight": "decimal",
                "gender": "categorical",
                "active": "boolean",
                "date_of_birth": "date",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert result.is_valid is True
        assert result.total_rows == 3
        assert result.valid_rows == 3
        assert result.invalid_rows == 0
        assert result.quarantined_rows == []
        assert result.quality_score == 100.0
        assert result.errors == []

    def test_invalid_rows_are_identified(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, None, 3],
                "age": [25, 200, 40],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert result.is_valid is False
        assert result.total_rows == 3
        assert result.valid_rows == 2
        assert result.invalid_rows == 1
        assert result.quarantined_rows == [1]
        assert result.quality_score == 66.67

    def test_warnings_do_not_quarantine_rows(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
                "gender": ["male", "unknown-value"],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "gender": "categorical",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert result.is_valid is True
        assert result.invalid_rows == 0
        assert result.quarantined_rows == []
        assert len(result.warnings) == 1
        assert result.quality_score == 100.0

    def test_dataset_level_error_does_not_quarantine_all_rows(
        self,
        engine,
    ):
        dataframe = pd.DataFrame(
            {
                "age": [20, 30],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "age": "integer",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert result.is_valid is False
        assert result.invalid_rows == 0
        assert result.quarantined_rows == []
        assert result.quality_score == 100.0

        assert any(
            error.code == "MISSING_REQUIRED_FIELD"
            for error in result.errors
        )

    def test_quality_score_for_empty_dataset(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": pd.Series(dtype="int64"),
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert result.total_rows == 0
        assert result.valid_rows == 0
        assert result.invalid_rows == 0
        assert result.quality_score == 100.0

    def test_split_valid_and_quarantined_rows(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, None, 3],
                "age": [25, 40, 50],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        valid, quarantined = engine.split_valid_and_quarantined(
            dataframe,
            result,
        )

        assert valid["patient_id"].tolist() == [1.0, 3.0]
        assert quarantined["patient_id"].isna().all()
        assert len(valid) == 2
        assert len(quarantined) == 1

    def test_split_rejects_mismatched_result(self, engine):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
            },
        )

        result = engine.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        result.total_rows = 999

        with pytest.raises(
            ValueError,
            match="does not match dataframe row count",
        ):
            engine.split_valid_and_quarantined(
                dataframe,
                result,
            )

    def test_invalid_dataframe_type_is_rejected(self, engine):
        profile = SchemaProfile(
            dataset_name="test",
            row_count=0,
            column_count=0,
        )

        with pytest.raises(
            TypeError,
            match="dataframe must be a pandas DataFrame",
        ):
            engine.validate(
                [],
                profile,
                CANONICAL_FIELDS,
            )