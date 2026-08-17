"""
Domain model representing a mapping between a hospital-specific
dataset field and a CareLink canonical field.
"""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class FieldMapping:
    """
    Represents one source-to-canonical field mapping.
    """

    source_field: str
    canonical_field: str
    match_method: str
    confidence: float

    def __post_init__(self) -> None:
        """
        Validate the mapping definition.
        """

        if not self.source_field.strip():
            raise ValueError("source_field cannot be empty.")

        if not self.canonical_field.strip():
            raise ValueError("canonical_field cannot be empty.")

        if not self.match_method.strip():
            raise ValueError("match_method cannot be empty.")

        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(
                "confidence must be between 0.0 and 1.0."
            )