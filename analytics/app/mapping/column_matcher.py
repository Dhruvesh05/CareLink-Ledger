"""
Matches hospital-specific dataset columns to CareLink canonical fields.
"""

from typing import Optional

from app.mapping.canonical_schema import (
    CANONICAL_FIELDS,
    CanonicalField,
)
from app.models.mapping import FieldMapping


class ColumnMatcher:
    """
    Matches source dataset columns against the CareLink canonical schema.

    Matching priority:

    1. Exact match
    2. Normalized-name match
    3. Alias match
    4. Datatype compatibility for alias matches
    """

    def match(
        self,
        source_field: str,
        source_data_type: Optional[str] = None,
    ) -> Optional[FieldMapping]:
        """
        Match one source field to a CareLink canonical field.

        Returns None when no reliable mapping can be established.
        """

        if not isinstance(source_field, str):
            raise TypeError("source_field must be a string.")

        if not source_field.strip():
            raise ValueError("source_field cannot be empty.")

        # ---------------------------------------------------------
        # 1. Exact canonical field match
        # ---------------------------------------------------------

        if source_field in CANONICAL_FIELDS:
            canonical = CANONICAL_FIELDS[source_field]

            return self._create_mapping(
                source_field=source_field,
                canonical=canonical,
                match_method="exact",
                confidence=1.0,
            )

        normalized_source = self._normalize(source_field)

        # ---------------------------------------------------------
        # 2. Normalized canonical field match
        # ---------------------------------------------------------

        for canonical in CANONICAL_FIELDS.values():
            if normalized_source == self._normalize(canonical.name):
                return self._create_mapping(
                    source_field=source_field,
                    canonical=canonical,
                    match_method="normalized",
                    confidence=0.98,
                )

        # ---------------------------------------------------------
        # 3. Alias match
        # ---------------------------------------------------------

        for canonical in CANONICAL_FIELDS.values():
            normalized_aliases = {
                self._normalize(alias)
                for alias in canonical.aliases
            }

            if normalized_source in normalized_aliases:

                confidence = 0.95

                # -------------------------------------------------
                # 4. Datatype compatibility
                # -------------------------------------------------

                if source_data_type is not None:
                    if self._datatype_matches(
                        source_data_type,
                        canonical,
                    ):
                        confidence = 0.97

                return self._create_mapping(
                    source_field=source_field,
                    canonical=canonical,
                    match_method="alias",
                    confidence=confidence,
                )

        # ---------------------------------------------------------
        # No reliable mapping
        # ---------------------------------------------------------

        return None

    @staticmethod
    def _create_mapping(
        source_field: str,
        canonical: CanonicalField,
        match_method: str,
        confidence: float,
    ) -> FieldMapping:
        """
        Construct a FieldMapping object.
        """

        return FieldMapping(
            source_field=source_field,
            canonical_field=canonical.name,
            match_method=match_method,
            confidence=confidence,
        )

    @staticmethod
    def _normalize(value: str) -> str:
        """
        Normalize a field name for comparison.

        Examples:

            "Patient ID" -> "patientid"
            "patient_id" -> "patientid"
            "Patient-ID" -> "patientid"
        """

        return (
            value.strip()
            .lower()
            .replace("_", "")
            .replace("-", "")
            .replace(" ", "")
        )

    @staticmethod
    def _datatype_matches(
        source_data_type: str,
        canonical: CanonicalField,
    ) -> bool:
        """
        Determine whether a source datatype is compatible with
        a canonical datatype.
        """

        if source_data_type == canonical.data_type:
            return True

        # Pandas may represent integer-semantic columns as decimal
        # when missing values are present.
        if (
            canonical.data_type == "integer"
            and source_data_type == "decimal"
        ):
            return True

        return False