"""
schema_analyzer.py

Coordinates the schema intelligence components and
produces a consolidated SchemaProfile.
"""

from __future__ import annotations

from app.models.schema_profile import SchemaProfile
from app.schemas.datatype_detector import DataTypeDetector
from app.schemas.fingerprint_generator import FingerprintGenerator
from app.schemas.metadata_extractor import MetadataExtractor
from app.schemas.statistics_generator import StatisticsGenerator

import pandas as pd


class SchemaAnalyzer:
    """
    Orchestrates the schema intelligence pipeline.
    """

    def __init__(
        self,
        datatype_detector: DataTypeDetector | None = None,
        metadata_extractor: MetadataExtractor | None = None,
        statistics_generator: StatisticsGenerator | None = None,
        fingerprint_generator: FingerprintGenerator | None = None,
    ) -> None:
        self.datatype_detector = (
            datatype_detector or DataTypeDetector()
        )

        self.metadata_extractor = (
            metadata_extractor or MetadataExtractor()
        )

        self.statistics_generator = (
            statistics_generator or StatisticsGenerator()
        )

        self.fingerprint_generator = (
            fingerprint_generator or FingerprintGenerator()
        )

    def analyze(
        self,
        dataframe: pd.DataFrame,
        dataset_name: str,
    ) -> SchemaProfile:
        """
        Analyze a dataset and generate a SchemaProfile.

        Args:
            dataframe: Input pandas DataFrame.
            dataset_name: Name of the dataset.

        Returns:
            Consolidated SchemaProfile.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        if not dataset_name or not dataset_name.strip():
            raise ValueError("dataset_name cannot be empty.")

        metadata = self.metadata_extractor.extract(dataframe)

        data_types = self.datatype_detector.detect(dataframe)

        statistics = self.statistics_generator.generate(dataframe)

        fingerprint = self.fingerprint_generator.generate(dataframe)

        potential_primary_keys = self._detect_primary_keys(
            dataframe
        )

        return SchemaProfile(
            dataset_name=dataset_name,
            row_count=metadata["row_count"],
            column_count=metadata["column_count"],
            columns=metadata["columns"],
            data_types=data_types,
            missing_values=metadata["missing_values"],
            missing_percentages=metadata["missing_percentages"],
            unique_values=metadata["unique_values"],
            duplicate_rows=metadata["duplicate_rows"],
            potential_primary_keys=potential_primary_keys,
            statistics=statistics,
            fingerprint=fingerprint,
        )

    def _detect_primary_keys(
        self,
        dataframe: pd.DataFrame,
    ) -> list[str]:
        """
        Identify columns that may act as primary keys.

        A column is considered a potential primary key when:
        - It contains no missing values.
        - Every value is unique.
        """

        potential_keys: list[str] = []

        for column in dataframe.columns:
            series = dataframe[column]

            if series.isna().any():
                continue

            if series.is_unique:
                potential_keys.append(column)

        return potential_keys