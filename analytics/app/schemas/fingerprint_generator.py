"""
fingerprint_generator.py

Generates deterministic SHA-256 fingerprints for datasets.
"""

from __future__ import annotations

import hashlib

import pandas as pd


class FingerprintGenerator:
    """
    Generates a deterministic SHA-256 fingerprint for a DataFrame.
    """

    def generate(self, dataframe: pd.DataFrame) -> str:
        """
        Generate a SHA-256 fingerprint for the supplied DataFrame.

        Args:
            dataframe: Input pandas DataFrame.

        Returns:
            Hexadecimal SHA-256 fingerprint.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame.")

        canonical_data = self._canonicalize(dataframe)

        return hashlib.sha256(
            canonical_data.encode("utf-8")
        ).hexdigest()

    def _canonicalize(self, dataframe: pd.DataFrame) -> str:
        """
        Convert the DataFrame into a deterministic string representation.
        """

        normalized = dataframe.copy()

        # Normalize column order.
        normalized = normalized.reindex(
            sorted(normalized.columns),
            axis=1,
        )

        # Normalize index.
        normalized = normalized.reset_index(drop=True)

        # Convert values to a deterministic CSV representation.
        return normalized.to_csv(
            index=False,
            lineterminator="\n",
        )