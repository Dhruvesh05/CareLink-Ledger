import pytest

from app.validation.validation_error import ValidationError
from app.validation.validation_warning import ValidationWarning
from app.validation.validation_result import ValidationResult


class TestValidationError:
    def test_creates_valid_error(self):
        error = ValidationError(
            field="age",
            row=2,
            code="INVALID_TYPE",
            message="Expected integer value",
            value="twenty",
        )

        assert error.field == "age"
        assert error.row == 2
        assert error.code == "INVALID_TYPE"
        assert error.message == "Expected integer value"
        assert error.value == "twenty"

    def test_rejects_empty_field(self):
        with pytest.raises(ValueError, match="field must not be empty"):
            ValidationError(
                field="",
                row=0,
                code="INVALID_TYPE",
                message="Invalid value",
            )

    def test_rejects_empty_code(self):
        with pytest.raises(ValueError, match="code must not be empty"):
            ValidationError(
                field="age",
                row=0,
                code="",
                message="Invalid value",
            )

    def test_rejects_negative_row(self):
        with pytest.raises(ValueError, match="row must be non-negative"):
            ValidationError(
                field="age",
                row=-1,
                code="INVALID_TYPE",
                message="Invalid value",
            )


class TestValidationWarning:
    def test_creates_valid_warning(self):
        warning = ValidationWarning(
            field="weight",
            row=4,
            code="HIGH_VALUE",
            message="Value is unusually high",
            value=150,
        )

        assert warning.field == "weight"
        assert warning.row == 4
        assert warning.code == "HIGH_VALUE"
        assert warning.message == "Value is unusually high"
        assert warning.value == 150

    def test_rejects_empty_field(self):
        with pytest.raises(ValueError, match="field must not be empty"):
            ValidationWarning(
                field="",
                row=0,
                code="HIGH_VALUE",
                message="Suspicious value",
            )


class TestValidationResult:
    def test_creates_valid_result(self):
        error = ValidationError(
            field="age",
            row=2,
            code="INVALID_TYPE",
            message="Expected integer value",
        )

        result = ValidationResult(
            total_rows=10,
            valid_rows=9,
            invalid_rows=1,
            errors=[error],
            quality_score=90.0,
        )

        assert result.total_rows == 10
        assert result.valid_rows == 9
        assert result.invalid_rows == 1
        assert len(result.errors) == 1
        assert result.is_valid is False

    def test_result_is_valid_when_no_invalid_rows(self):
        result = ValidationResult(
            total_rows=10,
            valid_rows=10,
            invalid_rows=0,
            quality_score=100.0,
        )

        assert result.is_valid is True

    def test_rejects_inconsistent_row_counts(self):
        with pytest.raises(
            ValueError,
            match="valid_rows \\+ invalid_rows must equal total_rows",
        ):
            ValidationResult(
                total_rows=10,
                valid_rows=8,
                invalid_rows=1,
                quality_score=80.0,
            )

    def test_rejects_invalid_quality_score(self):
        with pytest.raises(
            ValueError,
            match="quality_score must be between 0 and 100",
        ):
            ValidationResult(
                total_rows=10,
                valid_rows=10,
                invalid_rows=0,
                quality_score=101.0,
            )

    def test_quarantined_rows_are_preserved(self):
        result = ValidationResult(
            total_rows=5,
            valid_rows=3,
            invalid_rows=2,
            quarantined_rows=[1, 4],
            quality_score=60.0,
        )

        assert result.quarantined_rows == [1, 4]