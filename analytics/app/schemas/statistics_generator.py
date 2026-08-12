"""
statistics_generator.py

Generates descriptive statistics for dataset columns.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


class StatisticsGenerator:
    """
    Generates descriptive statistics for a pandas DataFrame.
    """

    def generate(
        self,
        dataframe: pd.DataFrame,
    ) -> dict[str, dict[str, Any]]:
        """
        Generate statistics for each column.

        Args:
            dataframe: Input pandas DataFrame.

        Returns:
            Dictionary containing statistics for each column.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        statistics: dict[str, dict[str, Any]] = {}

        for column in dataframe.columns:
            statistics[column] = self._generate_column_statistics(
                dataframe[column]
            )

        return statistics

    def _generate_column_statistics(
        self,
        series: pd.Series,
    ) -> dict[str, Any]:
        """
        Generate statistics for a single column.
        """

        non_null = series.dropna()

        result: dict[str, Any] = {
            "count": int(series.count()),
            "missing": int(series.isna().sum()),
            "unique": int(series.nunique(dropna=True)),
        }

        if non_null.empty:
            return result

        if pd.api.types.is_numeric_dtype(series):
            result.update(
                {
                    "min": float(non_null.min()),
                    "max": float(non_null.max()),
                    "mean": float(non_null.mean()),
                    "median": float(non_null.median()),
                    "std": (
                        float(non_null.std())
                        if len(non_null) > 1
                        else 0.0
                    ),
                }
            )

        else:
            mode = non_null.mode()

            result["most_frequent"] = (
                mode.iloc[0]
                if not mode.empty
                else None
            )

        return result