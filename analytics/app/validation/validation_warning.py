from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ValidationWarning:
    """Represents a non-blocking validation warning."""

    field: str
    row: int | None
    code: str
    message: str
    value: Any = None

    def __post_init__(self) -> None:
        if not self.field:
            raise ValueError("field must not be empty")

        if not self.code:
            raise ValueError("code must not be empty")

        if not self.message:
            raise ValueError("message must not be empty")

        if self.row is not None and self.row < 0:
            raise ValueError("row must be non-negative")