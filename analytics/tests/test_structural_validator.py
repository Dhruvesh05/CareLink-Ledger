import pandas as pd
import pytest

from app.mapping.canonical_schema import CANONICAL_FIELDS
from app.models.schema_profile import SchemaProfile
from app.validation.structural_validator import StructuralValidator


@pytest.fixture
def validator():
    return StructuralValidator()


def make_profile(dataframe, data_types, potential_primary_keys=None):
    return SchemaProfile(
        dataset_name="test_dataset",
        row_count=len(dataframe),
        column_count=len(dataframe.columns),
        columns=list(dataframe.columns),
        data_types=data_types,
        potential_primary_keys=potential_primary_keys or [],
    )


class TestStructuralValidator:
    def test_valid_dataset_has_no_errors_or_warnings(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2, 3],
                "age": [25, 40, 60],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "integer",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert errors == []
        assert warnings == []

    def test_missing_required_field_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": [25, 40],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "age": "integer",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert len(errors) == 1
        assert errors[0].field == "patient_id"
        assert errors[0].code == "MISSING_REQUIRED_FIELD"
        assert errors[0].row is None
        assert warnings == []

    def test_null_required_value_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, None, 3],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        null_errors = [
            error
            for error in errors
            if error.code == "NULL_REQUIRED_FIELD"
        ]

        assert len(null_errors) == 1
        assert null_errors[0].field == "patient_id"
        assert null_errors[0].row == 1
        assert warnings == []

    def test_incompatible_datatype_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
                "age": ["twenty", "thirty"],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "age": "string",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        datatype_errors = [
            error
            for error in errors
            if error.code == "INCOMPATIBLE_DATATYPE"
        ]

        assert len(datatype_errors) == 1
        assert datatype_errors[0].field == "age"
        assert datatype_errors[0].row is None

    def test_datetime_is_compatible_with_date(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
                "date_of_birth": pd.to_datetime(
                    ["2000-01-01", "1995-05-10"]
                ),
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "date_of_birth": "datetime",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert not any(
            error.field == "date_of_birth"
            and error.code == "INCOMPATIBLE_DATATYPE"
            for error in errors
        )

    def test_integer_is_compatible_with_decimal(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
                "weight": [60, 70],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
                "weight": "integer",
            },
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert not any(
            error.field == "weight"
            and error.code == "INCOMPATIBLE_DATATYPE"
            for error in errors
        )

    def test_duplicate_potential_primary_key_creates_warning(
        self,
        validator,
    ):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 1, 2],
            }
        )

        profile = make_profile(
            dataframe,
            {
                "patient_id": "integer",
            },
            potential_primary_keys=["patient_id"],
        )

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert errors == []

        duplicate_warnings = [
            warning
            for warning in warnings
            if warning.code == "DUPLICATE_PRIMARY_KEY"
        ]

        assert len(duplicate_warnings) == 2
        assert {warning.row for warning in duplicate_warnings} == {0, 1}

    def test_missing_non_required_field_is_not_error(self, validator):
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

        errors, warnings = validator.validate(
            dataframe,
            profile,
            CANONICAL_FIELDS,
        )

        assert errors == []
        assert warnings == []

    def test_invalid_dataframe_type_is_rejected(self, validator):
        profile = SchemaProfile(
            dataset_name="test",
            row_count=0,
            column_count=0,
        )

        with pytest.raises(
            TypeError,
            match="dataframe must be a pandas DataFrame",
        ):
            validator.validate(
                ["not", "a", "dataframe"],
                profile,
                CANONICAL_FIELDS,
            )

    def test_invalid_schema_profile_type_is_rejected(self, validator):
        dataframe = pd.DataFrame({"patient_id": [1]})

        with pytest.raises(
            TypeError,
            match="schema_profile must be a SchemaProfile",
        ):
            validator.validate(
                dataframe,
                {},
                CANONICAL_FIELDS,
            )

    def test_string_datatype_is_compatible_with_categorical_field(self):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2, 3],
                "gender": ["male", "female", "other"],
            }
        )

        profile = SchemaProfile(
            dataset_name="patients.csv",
            row_count=3,
            column_count=2,
            columns=["patient_id", "gender"],
            data_types={
                "patient_id": "integer",
                "gender": "string",
            },
            missing_values={
                "patient_id": 0,
                "gender": 0,
            },
            missing_percentages={
                "patient_id": 0.0,
                "gender": 0.0,
            },
            unique_values={
                "patient_id": 3,
                "gender": 3,
            },
            duplicate_rows=0,
            potential_primary_keys=["patient_id"],
            statistics={},
            fingerprint="test-fingerprint",
        )

        validator = StructuralValidator()

        errors, warnings = validator.validate(
            dataframe=dataframe,
            schema_profile=profile,
            canonical_fields=CANONICAL_FIELDS,
        )

        datatype_errors = [
            error
            for error in errors
            if error.code == "INCOMPATIBLE_DATATYPE"
        ]

        assert datatype_errors == []