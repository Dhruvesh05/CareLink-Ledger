"""
Registry responsible for managing field mappings
between hospital-specific schemas and the CareLink
canonical schema.
"""

from typing import List, Tuple

from app.models.mapping import FieldMapping


class MappingRegistry:
    """
    Registry for field mappings associated with dataset schemas.

    A mapping is uniquely identified by:
        (schema_id, source_field)
    """

    def __init__(self) -> None:
        self._items: dict[Tuple[str, str], FieldMapping] = {}

    def register(
        self,
        schema_id: str,
        mapping: FieldMapping,
    ) -> None:
        """
        Register a field mapping for a schema.

        Args:
            schema_id:
                Identifier of the schema the mapping belongs to.

            mapping:
                FieldMapping instance describing the source-to-canonical
                relationship.

        Raises:
            ValueError:
                If schema_id is empty or the mapping already exists.

            TypeError:
                If mapping is not a FieldMapping instance.
        """

        if not schema_id or not schema_id.strip():
            raise ValueError(
                "schema_id cannot be empty."
            )

        if not isinstance(mapping, FieldMapping):
            raise TypeError(
                "mapping must be a FieldMapping."
            )

        key = (
            schema_id,
            mapping.source_field,
        )

        if key in self._items:
            raise ValueError(
                f"Mapping for '{mapping.source_field}' "
                f"already exists in schema '{schema_id}'."
            )

        self._items[key] = mapping

    def get(
        self,
        schema_id: str,
        source_field: str,
    ) -> FieldMapping | None:
        """
        Retrieve a mapping using schema ID and source field.
        """

        return self._items.get(
            (schema_id, source_field)
        )

    def exists(
        self,
        schema_id: str,
        source_field: str,
    ) -> bool:
        """
        Determine whether a mapping exists.
        """

        return (
            schema_id,
            source_field,
        ) in self._items

    def get_for_schema(
        self,
        schema_id: str,
    ) -> List[FieldMapping]:
        """
        Retrieve all mappings belonging to a schema.
        """

        return [
            mapping
            for (registered_schema_id, _),
            mapping in self._items.items()
            if registered_schema_id == schema_id
        ]

    def remove(
        self,
        schema_id: str,
        source_field: str,
    ) -> None:
        """
        Remove a mapping from a schema.

        If the mapping does not exist, no error is raised.
        """

        self._items.pop(
            (schema_id, source_field),
            None,
        )

    def list_all(self) -> List[FieldMapping]:
        """
        Return all registered mappings.
        """

        return list(self._items.values())

    def count(self) -> int:
        """
        Return the total number of registered mappings.
        """

        return len(self._items)