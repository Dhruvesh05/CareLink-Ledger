"""
Concrete implementation of BaseLoader for Microsoft Excel datasets.
"""

from pathlib import Path

import pandas as pd

from app.ingestion.base_loader import BaseLoader


class ExcelLoader(BaseLoader):
    """
    Loads Microsoft Excel datasets into a pandas DataFrame.
    """

    SUPPORTED_EXTENSIONS = {".xlsx", ".xls"}

    def load(self, file_path: str) -> pd.DataFrame:

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Expected an Excel file, received '{path.suffix}'."
            )

        return pd.read_excel(path)