"""
Application-facing service for dataset validation.
"""

from __future__ import annotations

import pandas as pd

from app.mapping.canonical_schema import (
    CANONICAL_FIELDS,
    CanonicalField,
)
from app.models.schema_profile import SchemaProfile
from app.validation.validation_engine import ValidationEngine
from app.validation.validation_result import ValidationResult


class ValidationService:
    """
    Provides a high-level interface for dataset validation.

    The service delegates validation to ValidationEngine and exposes
    a stable interface for the rest of the Analytics application.
    """

    def __init__(
        self,
        engine: ValidationEngine | None = None,
    ) -> None:
        self.engine = engine or ValidationEngine()

    def validate_dataset(
        self,
        dataframe: pd.DataFrame,
        profile: SchemaProfile,
        canonical_fields: dict[str, CanonicalField] | None = None,
    ) -> ValidationResult:
        """
        Validate a dataset using its schema profile.

        Args:
            dataframe: Dataset represented as a pandas DataFrame.
            profile: Previously generated SchemaProfile.
            canonical_fields: Optional canonical schema override.

        Returns:
            ValidationResult containing validation findings and
            dataset quality information.
        """
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                "dataframe must be a pandas DataFrame."
            )

        if not isinstance(profile, SchemaProfile):
            raise TypeError(
                "profile must be a SchemaProfile."
            )

        fields = canonical_fields or CANONICAL_FIELDS

        return self.engine.validate(
            dataframe=dataframe,
            schema_profile=profile,
            canonical_fields=fields,
        )