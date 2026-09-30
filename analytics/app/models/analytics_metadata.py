"""
Metadata produced by the Analytics Layer after dataset processing.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AnalyticsMetadata:
    """
    Describes the processed healthcare dataset without storing
    the complete patient-level dataset.
    """

    dataset_name: str
    row_count: int
    column_count: int

    status: str = "UNKNOWN"

    schema_fingerprint: str | None = None

    source_fields: list[str] = field(default_factory=list)
    canonical_fields: list[str] = field(default_factory=list)
    unmapped_fields: list[str] = field(default_factory=list)

    mapping_count: int = 0
    mapping_complete: bool = False

    valid_rows: int = 0
    invalid_rows: int = 0
    quality_score: float = 0.0

    error_count: int = 0
    warning_count: int = 0
    quarantined_row_count: int = 0

    fhir_resource_types: list[str] = field(default_factory=list)
    fhir_resource_count: int = 0

    statistics: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.row_count < 0:
            raise ValueError("row_count must be non-negative")

        if self.column_count < 0:
            raise ValueError("column_count must be non-negative")

        if self.valid_rows < 0:
            raise ValueError("valid_rows must be non-negative")

        if self.invalid_rows < 0:
            raise ValueError("invalid_rows must be non-negative")

        if not 0.0 <= self.quality_score <= 100.0:
            raise ValueError(
                "quality_score must be between 0 and 100"
            )

        if self.mapping_count < 0:
            raise ValueError("mapping_count must be non-negative")

        if self.error_count < 0:
            raise ValueError("error_count must be non-negative")

        if self.warning_count < 0:
            raise ValueError("warning_count must be non-negative")

        if self.quarantined_row_count < 0:
            raise ValueError(
                "quarantined_row_count must be non-negative"
            )

        if self.fhir_resource_count < 0:
            raise ValueError(
                "fhir_resource_count must be non-negative"
            )