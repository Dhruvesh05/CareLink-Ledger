"""
metadata_extractor.py

Extracts structural and quality-related metadata
from healthcare datasets.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


class MetadataExtractor:
    """
    Extracts dataset-level and column-level metadata
    from a pandas DataFrame.
    """

    def extract(self, dataframe: pd.DataFrame) -> dict[str, Any]:
        """
        Extract metadata from a DataFrame.

        Args:
            dataframe: Input pandas DataFrame.

        Returns:
            Dictionary containing dataset and column metadata.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        return {
            "row_count": len(dataframe),
            "column_count": len(dataframe.columns),
            "columns": list(dataframe.columns),
            "missing_values": self._missing_values(dataframe),
            "missing_percentages": self._missing_percentages(dataframe),
            "unique_values": self._unique_values(dataframe),
            "duplicate_rows": int(dataframe.duplicated().sum()),
        }

    def _missing_values(
        self,
        dataframe: pd.DataFrame,
    ) -> dict[str, int]:
        """Return the number of missing values per column."""

        return {
            column: int(dataframe[column].isna().sum())
            for column in dataframe.columns
        }

    def _missing_percentages(
        self,
        dataframe: pd.DataFrame,
    ) -> dict[str, float]:
        """Return the percentage of missing values per column."""

        row_count = len(dataframe)

        if row_count == 0:
            return {
                column: 0.0
                for column in dataframe.columns
            }

        return {
            column: round(
                float(dataframe[column].isna().mean() * 100),
                2,
            )
            for column in dataframe.columns
        }

    def _unique_values(
        self,
        dataframe: pd.DataFrame,
    ) -> dict[str, int]:
        """Return the number of unique non-null values per column."""

        return {
            column: int(dataframe[column].nunique(dropna=True))
            for column in dataframe.columns
        }