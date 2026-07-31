"""
Public service responsible for loading datasets.
"""

import pandas as pd

from app.ingestion.loader_factory import LoaderFactory


class IngestionService:
    """
    Service responsible for dataset ingestion.
    """

    def load(self, file_path: str) -> pd.DataFrame:
        
        loader = LoaderFactory.get_loader(file_path)

        return loader.load(file_path)