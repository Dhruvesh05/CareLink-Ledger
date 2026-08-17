"""
Domain model representing the result of hospital-to-canonical
field mapping.
"""

from dataclasses import dataclass, field

from app.models.mapping import FieldMapping


@dataclass(frozen=True, slots=True)
class MappingResult:
    """
    Represents the complete result of mapping a source schema
    to the CareLink canonical schema.
    """

    mappings: tuple[FieldMapping, ...] = field(
        default_factory=tuple
    )

    unmapped_source_fields: tuple[str, ...] = field(
        default_factory=tuple
    )

    missing_required_fields: tuple[str, ...] = field(
        default_factory=tuple
    )

    @property
    def is_complete(self) -> bool:
        """
        Return True when no source fields are unmapped and all
        required canonical fields are present.
        """

        return (
            not self.unmapped_source_fields
            and not self.missing_required_fields
        )

    @property
    def mapping_count(self) -> int:
        """
        Return the number of successful field mappings.
        """

        return len(self.mappings)