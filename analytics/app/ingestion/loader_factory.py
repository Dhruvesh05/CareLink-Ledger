"""
Factory responsible for selecting the appropriate dataset loader.
"""

from pathlib import Path

from app.ingestion.base_loader import BaseLoader
from app.ingestion.csv_loader import CSVLoader
from app.ingestion.excel_loader import ExcelLoader
from app.ingestion.json_loader import JSONLoader


class LoaderFactory:
    """
    Factory class for creating dataset loaders based on file extension.
    """

    @staticmethod
    def get_loader(file_path: str) -> BaseLoader:

        suffix = Path(file_path).suffix.lower()

        if suffix == ".csv":
            return CSVLoader()

        if suffix in {".xlsx", ".xls"}:
            return ExcelLoader()

        if suffix == ".json":
            return JSONLoader()

        raise ValueError(
            f"Unsupported dataset format: '{suffix}'."
        )