from pathlib import Path

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".json"}


def get_extension(file_path: str) -> str:
    """Return the lowercase file extension."""
    return Path(file_path).suffix.lower()


def file_exists(file_path: str) -> bool:
    """Check whether a file exists."""
    return Path(file_path).is_file()