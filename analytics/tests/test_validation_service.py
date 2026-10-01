import pandas as pd
import pytest

from app.models.schema_profile import SchemaProfile
from app.validation.validation_service import ValidationService


@pytest.fixture
def service():
    return ValidationService()


def make_profile(dataframe, data_types):
    return SchemaProfile(
        dataset_name="test_dataset",
        row_count=len(dataframe),
        column_count=len(dataframe.columns),
        columns=list(dataframe.columns),
        data_types=data_types,
    )


class TestValidationService:
    def test_validates_dataset(self, service):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
                "age": [25, 40],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
            },
        )

        result = service.validate_dataset(
            dataframe,
            profile,
        )

        assert result.is_valid is True
        assert result.total_rows == 2
        assert result.valid_rows == 2
        assert result.invalid_rows == 0
        assert result.quality_score == 100.0

    def test_returns_validation_errors(self, service):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, None],
                "age": [25, 40],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
            },
        )

        result = service.validate_dataset(
            dataframe,
            profile,
        )

        assert result.is_valid is False
        assert result.invalid_rows == 1
        assert result.quarantined_rows == [1]
        assert any(
            error.code == "NULL_REQUIRED_FIELD"
            for error in result.errors
        )

    def test_accepts_custom_canonical_fields(self, service):
        dataframe = pd.DataFrame(
            {
                "record_id": [1, 2],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "record_id": "integer",
            },
        )

        custom_fields = {
            "record_id": type(
                "CustomField",
                (),
                {
                    "name": "record_id",
                    "data_type": "integer",
                    "required": True,
                    "aliases": (),
                },
            )()
        }

        result = service.validate_dataset(
            dataframe,
            profile,
            custom_fields,
        )

        assert result.is_valid is True
        assert result.total_rows == 2

    def test_rejects_invalid_dataframe(self, service):
        profile = SchemaProfile(
            dataset_name="test",
            row_count=0,
            column_count=0,
        )

        with pytest.raises(
            TypeError,
            match="dataframe must be a pandas DataFrame",
        ):
            service.validate_dataset(
                [],
                profile,
            )

    def test_rejects_invalid_profile(self, service):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1],
            }
        )

        with pytest.raises(
            TypeError,
            match="profile must be a SchemaProfile",
        ):
            service.validate_dataset(
                dataframe,
                {},
            )