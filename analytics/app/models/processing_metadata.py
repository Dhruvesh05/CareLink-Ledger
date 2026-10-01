"""
Metadata describing the outcome of an Analytics Layer pipeline run.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ProcessingMetadata:
    """
    Describes the processing outcome of a dataset through the
    Analytics Layer.

    This represents Analytics-level processing metadata only.
    It is intentionally independent of the final blockchain/IPFS
    metadata contract.
    """

    dataset_name: str
    status: str
    processed_at: datetime
    row_count: int
    column_count: int
    schema_fingerprint: str
    mapping_count: int
    quality_score: float
    fhir_resource_count: int

    def __post_init__(self) -> None:
        if not self.dataset_name:
            raise ValueError("dataset_name must not be empty")

        if not self.status:
            raise ValueError("status must not be empty")

        if self.row_count < 0:
            raise ValueError("row_count must be non-negative")

        if self.column_count < 0:
            raise ValueError("column_count must be non-negative")

        if not self.schema_fingerprint:
            raise ValueError("schema_fingerprint must not be empty")

        if self.mapping_count < 0:
            raise ValueError("mapping_count must be non-negative")

        if not 0.0 <= self.quality_score <= 100.0:
            raise ValueError(
                "quality_score must be between 0 and 100"
            )

        if self.fhir_resource_count < 0:
            raise ValueError(
                "fhir_resource_count must be non-negative"
            )

    @classmethod
    def create(
        cls,
        *,
        dataset_name: str,
        status: str,
        row_count: int,
        column_count: int,
        schema_fingerprint: str,
        mapping_count: int,
        quality_score: float,
        fhir_resource_count: int,
    ) -> "ProcessingMetadata":
        """
        Create processing metadata using the current UTC timestamp.
        """
        return cls(
            dataset_name=dataset_name,
            status=status,
            processed_at=datetime.now(timezone.utc),
            row_count=row_count,
            column_count=column_count,
            schema_fingerprint=schema_fingerprint,
            mapping_count=mapping_count,
            quality_score=quality_score,
            fhir_resource_count=fhir_resource_count,
        )