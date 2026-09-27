import pandas as pd
import pytest

from app.validation.semantic_validator import SemanticValidator


@pytest.fixture
def validator():
    return SemanticValidator()


class TestSemanticValidator:
    def test_valid_values_have_no_errors_or_warnings(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": [25, 40],
                "weight": [60.5, 72],
                "gender": ["Male", "female"],
                "active": [True, False],
                "date_of_birth": ["2001-01-01", "1985-05-10"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert errors == []
        assert warnings == []

    def test_non_numeric_age_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": ["twenty"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "INVALID_AGE"
        assert errors[0].row == 0

    def test_age_out_of_range_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": [150],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "AGE_OUT_OF_RANGE"
        assert errors[0].row == 0

    def test_negative_age_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": [-5],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "AGE_OUT_OF_RANGE"

    def test_fractional_age_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "age": [25.5],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "INVALID_AGE"

    def test_non_numeric_weight_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "weight": ["heavy"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "INVALID_WEIGHT"

    def test_non_positive_weight_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "weight": [0, -10],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 2
        assert all(
            error.code == "INVALID_WEIGHT"
            for error in errors
        )

    def test_unknown_gender_is_warning(self, validator):
        dataframe = pd.DataFrame(
            {
                "gender": ["UnknownValue"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert errors == []
        assert len(warnings) == 1
        assert warnings[0].code == "UNKNOWN_GENDER"
        assert warnings[0].row == 0

    def test_gender_matching_is_case_insensitive(self, validator):
        dataframe = pd.DataFrame(
            {
                "gender": ["MALE", " Female ", "other", "UNKNOWN"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert errors == []
        assert warnings == []

    def test_invalid_active_value_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "active": ["maybe"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "INVALID_BOOLEAN"

    def test_valid_boolean_compatible_values(self, validator):
        dataframe = pd.DataFrame(
            {
                "active": [
                    True,
                    False,
                    0,
                    1,
                    "yes",
                    "no",
                    "Y",
                    "N",
                ],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert errors == []
        assert warnings == []

    def test_invalid_date_is_error(self, validator):
        dataframe = pd.DataFrame(
            {
                "date_of_birth": ["not-a-date"],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert len(errors) == 1
        assert errors[0].code == "INVALID_DATE"
        assert errors[0].row == 0

    def test_missing_optional_columns_are_ignored(self, validator):
        dataframe = pd.DataFrame(
            {
                "patient_id": [1, 2],
            }
        )

        errors, warnings = validator.validate(dataframe)

        assert errors == []
        assert warnings == []

    def test_invalid_dataframe_type_is_rejected(self, validator):
        with pytest.raises(
            TypeError,
            match="dataframe must be a pandas DataFrame",
        ):
            validator.validate(["not", "a", "dataframe"])