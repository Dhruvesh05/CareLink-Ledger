"""
Concrete implementation of BaseLoader for JSON datasets.
"""

from pathlib import Path

import pandas as pd

from app.ingestion.base_loader import BaseLoader


class JSONLoader(BaseLoader):
    """
    Loads JSON datasets into a pandas DataFrame.
    """

    def load(self, file_path: str) -> pd.DataFrame:

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if path.suffix.lower() != ".json":
            raise ValueError(
                f"Expected a JSON file, received '{path.suffix}'."
            )

        return pd.read_json(path)