"""
schema_service.py

Application-facing service for dataset schema analysis.
"""

from __future__ import annotations

import pandas as pd

from app.models.schema_profile import SchemaProfile
from app.mapping.schema_detector import SchemaDetector
from app.schemas.schema_analyzer import SchemaAnalyzer


class SchemaService:
    """
    Provides a high-level interface for schema analysis.

    The service delegates the actual analysis to SchemaAnalyzer
    and exposes a stable interface for other application modules.
    """

    def __init__(
        self,
        analyzer: SchemaAnalyzer | None = None,
        schema_detector: SchemaDetector | None = None,
    ) -> None:
        self.analyzer = analyzer or SchemaAnalyzer()
        self.schema_detector = schema_detector or SchemaDetector()

    def analyze_dataset(
        self,
        dataframe: pd.DataFrame,
        dataset_name: str,
    ) -> SchemaProfile:
        """
        Analyze a dataset and return its SchemaProfile.

        Args:
            dataframe: Dataset represented as a pandas DataFrame.
            dataset_name: Name or identifier of the dataset.

        Returns:
            SchemaProfile containing the analyzed dataset information.
        """

        profile = self.analyzer.analyze(
            dataframe=dataframe,
            dataset_name=dataset_name,
        )
        profile.schema_version = self.schema_detector.resolve_schema_version(
            profile
        )
        return profile