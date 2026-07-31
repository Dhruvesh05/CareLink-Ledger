"""
Generic base registry implementation.
"""

from typing import Dict, Generic, List, Optional, TypeVar

T = TypeVar("T")


class BaseRegistry(Generic[T]):

    def __init__(self):

        self._items: Dict[str, T] = {}

    def register(self, key: str, item: T) -> None:

        if key in self._items:
            raise ValueError(f"{key} already exists.")

        self._items[key] = item

    def get(self, key: str) -> Optional[T]:

        return self._items.get(key)

    def exists(self, key: str) -> bool:

        return key in self._items

    def remove(self, key: str) -> None:

        self._items.pop(key, None)

    def list_all(self) -> List[T]:

        return list(self._items.values())

    def count(self) -> int:

        return len(self._items)