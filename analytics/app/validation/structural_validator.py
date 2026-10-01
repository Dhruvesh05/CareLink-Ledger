"""
Structural validation for CareLink Analytics datasets.

Structural validation checks whether a dataset conforms to the
expected schema structure before semantic validation is performed.
"""

from __future__ import annotations

from typing import Mapping

import pandas as pd

from app.mapping.canonical_schema import CanonicalField
from app.models.schema_profile import SchemaProfile
from app.validation.validation_error import ValidationError
from app.validation.validation_warning import ValidationWarning


class StructuralValidator:
    """Validate dataset structure against the expected schema."""

    def validate(
        self,
        dataframe: pd.DataFrame,
        schema_profile: SchemaProfile,
        canonical_fields: Mapping[str, CanonicalField],
    ) -> tuple[list[ValidationError], list[ValidationWarning]]:
        """
        Validate the structural properties of a dataset.

        Args:
            dataframe: Dataset to validate.
            schema_profile: Detected profile of the dataset.
            canonical_fields: Expected CareLink canonical fields.

        Returns:
            A tuple containing validation errors and warnings.
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        if not isinstance(schema_profile, SchemaProfile):
            raise TypeError("schema_profile must be a SchemaProfile.")

        errors: list[ValidationError] = []
        warnings: list[ValidationWarning] = []

        self._validate_required_fields(
            dataframe,
            canonical_fields,
            errors,
        )

        self._validate_required_values(
            dataframe,
            canonical_fields,
            errors,
        )

        self._validate_datatypes(
            schema_profile,
            dataframe,
            canonical_fields,
            errors,
        )

        self._validate_primary_key_duplicates(
            dataframe,
            schema_profile,
            warnings,
        )

        return errors, warnings

    def _validate_required_fields(
        self,
        dataframe: pd.DataFrame,
        canonical_fields: Mapping[str, CanonicalField],
        errors: list[ValidationError],
    ) -> None:
        """Check that every required canonical field is present."""

        for field_name, field in canonical_fields.items():
            if field.required and field_name not in dataframe.columns:
                errors.append(
                    ValidationError(
                        field=field_name,
                        row=None,
                        code="MISSING_REQUIRED_FIELD",
                        message=(
                            f"Required field '{field_name}' "
                            "is missing from the dataset."
                        ),
                    )
                )

    def _validate_required_values(
        self,
        dataframe: pd.DataFrame,
        canonical_fields: Mapping[str, CanonicalField],
        errors: list[ValidationError],
    ) -> None:
        """Check for null values in required fields."""

        for field_name, field in canonical_fields.items():
            if not field.required or field_name not in dataframe.columns:
                continue

            null_rows = dataframe.index[dataframe[field_name].isna()]

            for row_index in null_rows:
                errors.append(
                    ValidationError(
                        field=field_name,
                        row=int(row_index),
                        code="NULL_REQUIRED_FIELD",
                        message=(
                            f"Required field '{field_name}' "
                            "cannot be null."
                        ),
                        value=None,
                    )
                )

    def _validate_datatypes(
        self,
        schema_profile: SchemaProfile,
        dataframe: pd.DataFrame,
        canonical_fields: Mapping[str, CanonicalField],
        errors: list[ValidationError],
    ) -> None:
        """Check compatibility between detected and expected datatypes."""

        for field_name, field in canonical_fields.items():
            if field_name not in dataframe.columns:
                continue

            detected_type = schema_profile.data_types.get(field_name)

            if detected_type is None:
                continue

            if not self._is_compatible_type(
                detected_type,
                field.data_type,
            ):
                errors.append(
                    ValidationError(
                        field=field_name,
                        row=None,
                        code="INCOMPATIBLE_DATATYPE",
                        message=(
                            f"Field '{field_name}' has detected datatype "
                            f"'{detected_type}', expected "
                            f"'{field.data_type}'."
                        ),
                        value=detected_type,
                    )
                )

    def _validate_primary_key_duplicates(
        self,
        dataframe: pd.DataFrame,
        schema_profile: SchemaProfile,
        warnings: list[ValidationWarning],
    ) -> None:
        """Warn when a potential primary key contains duplicates."""

        for field_name in schema_profile.potential_primary_keys:
            if field_name not in dataframe.columns:
                continue

            duplicate_mask = dataframe[field_name].duplicated(
                keep=False
            )

            duplicate_rows = dataframe.index[duplicate_mask]

            for row_index in duplicate_rows:
                warnings.append(
                    ValidationWarning(
                        field=field_name,
                        row=int(row_index),
                        code="DUPLICATE_PRIMARY_KEY",
                        message=(
                            f"Potential primary key '{field_name}' "
                            "contains a duplicate value."
                        ),
                        value=dataframe.at[row_index, field_name],
                    )
                )

    @staticmethod
    def _is_compatible_type(
        detected_type: str,
        expected_type: str,
    ) -> bool:
        if detected_type == expected_type:
            return True
        if expected_type == "date" and detected_type == "datetime":
            return True

        if expected_type == "decimal" and detected_type == "integer":
            return True

        if expected_type == "categorical" and detected_type == "string":
            return True

        return False