"""
Custom exceptions used throughout the Analytics module.
"""


class RegistryError(Exception):
    """Base class for registry-related exceptions."""


class DuplicateEntryError(RegistryError):
    """Raised when attempting to register a duplicate entry."""


class EntryNotFoundError(RegistryError):
    """Raised when an entry cannot be found."""