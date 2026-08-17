"""
Registry responsible for managing registered dataset schemas.
"""

from typing import Optional

from app.models.schema import Schema
from app.registry.base_registry import BaseRegistry


class SchemaRegistry(BaseRegistry[Schema]):
    """
    Registry for schemas known to the CareLink Analytics Layer.
    """

    def register(self, schema: Schema) -> None:
        """
        Register a schema using its schema ID as the registry key.
        """

        super().register(
            schema.schema_id,
            schema,
        )

    def get_by_fingerprint(
        self,
        fingerprint: str,
    ) -> Optional[Schema]:
        """
        Retrieve a registered schema using its fingerprint.

        Returns:
            Matching Schema if found, otherwise None.
        """

        for schema in self._items.values():
            if schema.fingerprint == fingerprint:
                return schema

        return None

    def exists_by_fingerprint(
        self,
        fingerprint: str,
    ) -> bool:
        """
        Determine whether a schema with the supplied fingerprint
        is already registered.
        """

        return self.get_by_fingerprint(fingerprint) is not None