from dataclasses import dataclass, field
from typing import Any

from app.validation.validation_error import ValidationError
from app.validation.validation_warning import ValidationWarning


@dataclass
class ValidationResult:
    """Contains the complete outcome of dataset validation."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: list[ValidationError] = field(default_factory=list)
    warnings: list[ValidationWarning] = field(default_factory=list)
    quarantined_rows: list[int] = field(default_factory=list)
    quality_score: float = 0.0

    @property
    def is_valid(self) -> bool:
        """Return True when no validation errors are present."""
        return len(self.errors) == 0

    def __post_init__(self) -> None:
        if self.total_rows < 0:
            raise ValueError("total_rows must be non-negative")

        if self.valid_rows < 0:
            raise ValueError("valid_rows must be non-negative")

        if self.invalid_rows < 0:
            raise ValueError("invalid_rows must be non-negative")

        if self.valid_rows + self.invalid_rows != self.total_rows:
            raise ValueError(
                "valid_rows + invalid_rows must equal total_rows"
            )

        if not 0.0 <= self.quality_score <= 100.0:
            raise ValueError("quality_score must be between 0 and 100")