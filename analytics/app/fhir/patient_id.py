
"""Shared patient-ID normalization for FHIR resources."""

import math
import re
from numbers import Integral, Real
from typing import Any


_FHIR_ID_PATTERN = re.compile(r"^[A-Za-z0-9.-]{1,64}$")


def normalize_patient_id(value: Any) -> str:
    """
    Normalize a source patient ID into a valid FHIR logical ID.

    Numeric integral values such as 101, 101.0, and numpy integral
    values resolve to the same ID. Meaningful string IDs are preserved.
    Invalid or missing IDs are rejected rather than silently rewritten.
    """
    if value is None:
        raise ValueError("Patient ID cannot be missing.")

    # Handle pandas/numpy missing values without requiring a pandas import.
    try:
        if bool(value != value):  # NaN
            raise ValueError("Patient ID cannot be missing.")
    except (TypeError, ValueError):
        if isinstance(value, float) and math.isnan(value):
            raise ValueError("Patient ID cannot be missing.")

    if isinstance(value, bool):
        raise ValueError("Boolean values are not valid patient IDs.")

    if isinstance(value, Integral):
        normalized = str(int(value))
    elif isinstance(value, Real):
        number = float(value)
        if not math.isfinite(number) or not number.is_integer():
            raise ValueError(f"Patient ID must be integral when numeric: {value!r}")
        normalized = str(int(number))
    else:
        normalized = str(value).strip()

    if not normalized:
        raise ValueError("Patient ID cannot be empty.")

    if not _FHIR_ID_PATTERN.fullmatch(normalized):
        raise ValueError(
            f"Patient ID {normalized!r} is not a valid FHIR ID. "
            "Use a deterministic ID mapping rather than silently sanitizing it."
        )

    return normalized
