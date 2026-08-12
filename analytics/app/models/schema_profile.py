"""
Domain model representing the structural and statistical profile of a healthcare dataset.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SchemaProfile:
    """
    Represents the automatically detected schema profile of a healthcare dataset.
    """

    dataset_name: str
    row_count: int
    column_count: int
    columns: list[str] = field(default_factory=list)

    data_types: dict[str, str] = field(default_factory=dict)

    missing_values: dict[str, int] = field(default_factory=dict)

    missing_percentages: dict[str, float] = field(default_factory=dict)

    unique_values: dict[str, int] = field(default_factory=dict)

    duplicate_rows: int = 0

    potential_primary_keys: list[str] = field(default_factory=list)

    statistics: dict[str, dict[str, Any]] = field(
        default_factory=dict
    )

    fingerprint: str | None = None