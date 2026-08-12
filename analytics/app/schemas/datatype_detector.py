"""
datatype_detector.py

Detects the technical and basic logical data types
of columns in a healthcare dataset.
"""

from __future__ import annotations

import pandas as pd


class DataTypeDetector:
    """
    Detects logical data types for DataFrame columns.

    The detector intentionally focuses on datatype detection.
    Semantic interpretation of healthcare fields is handled
    by a later stage of the analytics pipeline.
    """

    def detect(self, dataframe: pd.DataFrame) -> dict[str, str]:
        """
        Detect the logical datatype of every column.

        Args:
            dataframe: Input pandas DataFrame.

        Returns:
            Dictionary mapping column names to detected datatypes.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        detected_types: dict[str, str] = {}

        for column in dataframe.columns:
            detected_types[column] = self._detect_column_type(
                dataframe[column]
            )

        return detected_types

    def _detect_column_type(self, series: pd.Series) -> str:
        """
        Detect the logical datatype of a single column.
        """

        # Boolean
        if pd.api.types.is_bool_dtype(series):
            return "boolean"

        # Integer
        if pd.api.types.is_integer_dtype(series):
            return "integer"

        # Floating-point / decimal
        if pd.api.types.is_float_dtype(series):
            non_null = series.dropna()

            if not non_null.empty and (non_null % 1 == 0).all():
                return "integer"

            return "decimal"

        # Datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"

        # Categorical
        if isinstance(series.dtype, pd.CategoricalDtype):
            return "categorical"

        # Object/string columns need further inspection.
        if pd.api.types.is_object_dtype(series):
            return self._detect_object_type(series)

        # Fallback
        return str(series.dtype)

    def _detect_object_type(self, series: pd.Series) -> str:
        """
        Detect the logical datatype of an object/string column.
        """

        non_null = series.dropna()

        if non_null.empty:
            return "unknown"

        # Convert values to strings for pattern inspection.
        values = non_null.astype(str).str.strip()

        # Date detection
        parsed_dates = pd.to_datetime(
            values,
            errors="coerce",
            format="mixed"
        )

        if parsed_dates.notna().mean() >= 0.90:
            return "date"

        # Boolean-like values
        boolean_values = {
            "true",
            "false",
            "yes",
            "no",
            "y",
            "n",
        }

        if values.str.lower().isin(boolean_values).mean() >= 0.90:
            return "boolean"

        # Numeric strings
        numeric_values = pd.to_numeric(
            values,
            errors="coerce"
        )

        if numeric_values.notna().mean() >= 0.90:

            if (numeric_values % 1 == 0).all():
                return "integer"

            return "decimal"

        # Low-cardinality values can be treated as categorical.
        unique_count = values.nunique()
        unique_ratio = unique_count / len(values)

        if unique_count <= 10 and unique_ratio <= 0.50:
            return "categorical"

        return "string"