"""
Concrete implementation of BaseLoader for CSV datasets.
"""

from pathlib import Path
import pandas as pd
from app.ingestion.base_loader import BaseLoader

class CSVLoader(BaseLoader): #Loads CSV datasets into a pandas DataFrame.

    def load(self, file_path: str) -> pd.DataFrame:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if path.suffix.lower() != ".csv":
            raise ValueError(
                f"Expected a CSV file, received '{path.suffix}'."
            )

        return pd.read_csv(path)