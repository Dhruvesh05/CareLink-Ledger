"""
Validation orchestration for the CareLink Analytics Layer.

The ValidationEngine coordinates structural and semantic validation,
aggregates validation findings, identifies invalid rows, and computes
an explainable dataset quality score.
"""

from __future__ import annotations

from typing import Mapping

import pandas as pd

from app.mapping.canonical_schema import CanonicalField
from app.models.schema_profile import SchemaProfile
from app.validation.semantic_validator import SemanticValidator
from app.validation.structural_validator import StructuralValidator
from app.validation.validation_error import ValidationError
from app.validation.validation_result import ValidationResult
from app.validation.validation_warning import ValidationWarning


class ValidationEngine:
    """Coordinate structural and semantic dataset validation."""

    def __init__(
        self,
        structural_validator: StructuralValidator | None = None,
        semantic_validator: SemanticValidator | None = None,
    ) -> None:
        self.structural_validator = (
            structural_validator or StructuralValidator()
        )
        self.semantic_validator = (
            semantic_validator or SemanticValidator()
        )

    def validate(
        self,
        dataframe: pd.DataFrame,
        schema_profile: SchemaProfile,
        canonical_fields: Mapping[str, CanonicalField],
    ) -> ValidationResult:
        """
        Validate a dataset and return the aggregated result.

        Args:
            dataframe: Dataset to validate.
            schema_profile: Detected schema profile.
            canonical_fields: Expected canonical fields.

        Returns:
            Complete ValidationResult.
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        structural_errors, structural_warnings = (
            self.structural_validator.validate(
                dataframe,
                schema_profile,
                canonical_fields,
            )
        )

        semantic_errors, semantic_warnings = (
            self.semantic_validator.validate(dataframe)
        )

        errors = structural_errors + semantic_errors
        warnings = structural_warnings + semantic_warnings

        invalid_rows = self._get_invalid_rows(
            errors,
            total_rows=len(dataframe),
        )

        quarantined_rows = sorted(invalid_rows)

        invalid_count = len(quarantined_rows)
        valid_count = len(dataframe) - invalid_count

        quality_score = self._calculate_quality_score(
            total_rows=len(dataframe),
            valid_rows=valid_count,
        )

        return ValidationResult(
            total_rows=len(dataframe),
            valid_rows=valid_count,
            invalid_rows=invalid_count,
            errors=errors,
            warnings=warnings,
            quarantined_rows=quarantined_rows,
            quality_score=quality_score,
        )

    @staticmethod
    def split_valid_and_quarantined(
        dataframe: pd.DataFrame,
        result: ValidationResult,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split a dataset into valid and quarantined rows.

        Returns:
            Tuple of (valid_dataframe, quarantined_dataframe).
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        if result.total_rows != len(dataframe):
            raise ValueError(
                "ValidationResult does not match dataframe row count."
            )

        quarantine_mask = dataframe.index.isin(
            result.quarantined_rows
        )

        quarantined = dataframe.loc[quarantine_mask].copy()
        valid = dataframe.loc[~quarantine_mask].copy()

        return valid, quarantined

    @staticmethod
    def _get_invalid_rows(
        errors: list[ValidationError],
        total_rows: int,
    ) -> set[int]:
        """
        Identify rows affected by row-level validation errors.

        Dataset-level errors use row=None and therefore do not directly
        quarantine a specific row.
        """
        invalid_rows: set[int] = set()

        for error in errors:
            if error.row is not None and 0 <= error.row < total_rows:
                invalid_rows.add(error.row)

        return invalid_rows

    @staticmethod
    def _calculate_quality_score(
        total_rows: int,
        valid_rows: int,
    ) -> float:
        """Calculate quality as the percentage of valid rows."""

        if total_rows == 0:
            return 100.0

        score = (valid_rows / total_rows) * 100

        return round(score, 2)