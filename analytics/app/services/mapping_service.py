"""
mapping_service.py

Application-facing service responsible for executing and
registering dataset field mappings.
"""

from __future__ import annotations

from app.mapping.mapping_engine import MappingEngine
from app.models.mapping_result import MappingResult
from app.models.schema_profile import SchemaProfile
from app.registry.mapping_registry import MappingRegistry


class MappingService:
    """
    Coordinates mapping generation and mapping registration.
    """

    def __init__(
        self,
        mapping_engine: MappingEngine | None = None,
        mapping_registry: MappingRegistry | None = None,
    ) -> None:

        self.mapping_engine = (
            mapping_engine or MappingEngine()
        )

        self.mapping_registry = (
            mapping_registry or MappingRegistry()
        )

    def map_dataset(
        self,
        profile: SchemaProfile,
    ) -> MappingResult:
        """
        Generate mappings for a dataset schema.

        The mappings are not automatically registered here.
        This method performs mapping only.
        """

        if not isinstance(profile, SchemaProfile):
            raise TypeError(
                "profile must be a SchemaProfile."
            )

        return self.mapping_engine.map(profile)

    def map_and_register(
        self,
        schema_id: str,
        profile: SchemaProfile,
    ) -> MappingResult:
        """
        Generate mappings and register them under a schema ID.
        """

        if not schema_id or not schema_id.strip():
            raise ValueError(
                "schema_id cannot be empty."
            )

        if not isinstance(profile, SchemaProfile):
            raise TypeError(
                "profile must be a SchemaProfile."
            )

        result = self.mapping_engine.map(profile)

        for mapping in result.mappings:
            self.mapping_registry.register(
                schema_id,
                mapping,
            )

        return result