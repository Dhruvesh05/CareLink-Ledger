"""
Semantic validation for CareLink Analytics datasets.

Semantic validation checks whether values are meaningful and
within the configured domain constraints of canonical fields.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.validation.validation_error import ValidationError
from app.validation.validation_warning import ValidationWarning


class SemanticValidator:
    """Validate semantic constraints on canonical healthcare fields."""

    ALLOWED_GENDERS = {
        "male",
        "female",
        "other",
        "unknown",
    }

    MIN_AGE = 0
    MAX_AGE = 120

    def validate(
        self,
        dataframe: pd.DataFrame,
    ) -> tuple[list[ValidationError], list[ValidationWarning]]:
        """
        Validate semantic rules on canonical fields.

        Args:
            dataframe: Canonical or partially canonical DataFrame.

        Returns:
            A tuple containing validation errors and warnings.
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        errors: list[ValidationError] = []
        warnings: list[ValidationWarning] = []

        self._validate_age(dataframe, errors)
        self._validate_weight(dataframe, errors)
        self._validate_gender(dataframe, warnings)
        self._validate_active(dataframe, errors)
        self._validate_date_of_birth(dataframe, errors)

        return errors, warnings

    def _validate_age(
        self,
        dataframe: pd.DataFrame,
        errors: list[ValidationError],
    ) -> None:
        """Validate age values."""

        if "age" not in dataframe.columns:
            return

        for row_index, value in dataframe["age"].items():
            if pd.isna(value):
                continue

            numeric_value = pd.to_numeric(
                pd.Series([value]),
                errors="coerce",
            ).iloc[0]

            if pd.isna(numeric_value):
                errors.append(
                    ValidationError(
                        field="age",
                        row=int(row_index),
                        code="INVALID_AGE",
                        message="Age must be numeric.",
                        value=value,
                    )
                )
                continue

            if numeric_value % 1 != 0:
                errors.append(
                    ValidationError(
                        field="age",
                        row=int(row_index),
                        code="INVALID_AGE",
                        message="Age must be an integer.",
                        value=value,
                    )
                )
                continue

            if not self.MIN_AGE <= numeric_value <= self.MAX_AGE:
                errors.append(
                    ValidationError(
                        field="age",
                        row=int(row_index),
                        code="AGE_OUT_OF_RANGE",
                        message=(
                            f"Age must be between {self.MIN_AGE} "
                            f"and {self.MAX_AGE}."
                        ),
                        value=value,
                    )
                )

    def _validate_weight(
        self,
        dataframe: pd.DataFrame,
        errors: list[ValidationError],
    ) -> None:
        """Validate weight values."""

        if "weight" not in dataframe.columns:
            return

        for row_index, value in dataframe["weight"].items():
            if pd.isna(value):
                continue

            numeric_value = pd.to_numeric(
                pd.Series([value]),
                errors="coerce",
            ).iloc[0]

            if pd.isna(numeric_value):
                errors.append(
                    ValidationError(
                        field="weight",
                        row=int(row_index),
                        code="INVALID_WEIGHT",
                        message="Weight must be numeric.",
                        value=value,
                    )
                )
                continue

            if numeric_value <= 0:
                errors.append(
                    ValidationError(
                        field="weight",
                        row=int(row_index),
                        code="INVALID_WEIGHT",
                        message="Weight must be greater than zero.",
                        value=value,
                    )
                )

    def _validate_gender(
        self,
        dataframe: pd.DataFrame,
        warnings: list[ValidationWarning],
    ) -> None:
        """Validate gender values against the configured domain."""

        if "gender" not in dataframe.columns:
            return

        for row_index, value in dataframe["gender"].items():
            if pd.isna(value):
                continue

            normalized = str(value).strip().lower()

            if normalized not in self.ALLOWED_GENDERS:
                warnings.append(
                    ValidationWarning(
                        field="gender",
                        row=int(row_index),
                        code="UNKNOWN_GENDER",
                        message=(
                            f"Gender value '{value}' is not in the "
                            "configured allowed values."
                        ),
                        value=value,
                    )
                )

    def _validate_active(
        self,
        dataframe: pd.DataFrame,
        errors: list[ValidationError],
    ) -> None:
        """Validate boolean-compatible active values."""

        if "active" not in dataframe.columns:
            return

        allowed_strings = {
            "true",
            "false",
            "yes",
            "no",
            "y",
            "n",
        }

        for row_index, value in dataframe["active"].items():
            if pd.isna(value):
                continue

            if isinstance(value, bool):
                continue

            if isinstance(value, (int, float)) and value in {0, 1}:
                continue

            if isinstance(value, str):
                if value.strip().lower() in allowed_strings:
                    continue

            errors.append(
                ValidationError(
                    field="active",
                    row=int(row_index),
                    code="INVALID_BOOLEAN",
                    message=(
                        "Active must be a boolean-compatible value."
                    ),
                    value=value,
                )
            )

    def _validate_date_of_birth(
        self,
        dataframe: pd.DataFrame,
        errors: list[ValidationError],
    ) -> None:
        """Validate date_of_birth values."""

        if "date_of_birth" not in dataframe.columns:
            return

        for row_index, value in dataframe["date_of_birth"].items():
            if pd.isna(value):
                continue

            parsed = pd.to_datetime(
                pd.Series([value]),
                errors="coerce",
                format="mixed",
            ).iloc[0]

            if pd.isna(parsed):
                errors.append(
                    ValidationError(
                        field="date_of_birth",
                        row=int(row_index),
                        code="INVALID_DATE",
                        message="Date of birth must be a valid date.",
                        value=value,
                    )
                )