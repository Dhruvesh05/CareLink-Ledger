"""
Maps canonical patient data to FHIR R4 Patient resources.
"""

from __future__ import annotations

from numbers import Integral, Real
from typing import Any

import pandas as pd
from fhir.resources.patient import Patient


class PatientMapper:
    """
    Converts one canonical DataFrame row into a FHIR Patient resource.
    """

    def map_row(self, row: pd.Series) -> Patient:
        """
        Map a canonical patient row to a FHIR Patient resource.

        Required canonical field:
            patient_id

        Optional canonical fields:
            gender
            date_of_birth
            active
        """

        patient_id = row.get("patient_id")

        if pd.isna(patient_id):
            raise ValueError("patient_id is required for FHIR Patient mapping.")

        patient_data: dict[str, Any] = {
            "id": str(patient_id),
        }

        gender = row.get("gender")

        if gender is not None and not pd.isna(gender):
            patient_data["gender"] = str(gender).strip().lower()

        date_of_birth = row.get("date_of_birth")

        if date_of_birth is not None and not pd.isna(date_of_birth):
            patient_data["birthDate"] = self._format_date(date_of_birth)

        active = row.get("active")

        if active is not None and not pd.isna(active):
            patient_data["active"] = self._to_bool(active)

        return Patient(**patient_data)

    @staticmethod
    def _format_date(value: Any) -> str:
        """
        Convert a date-like value to FHIR date format: YYYY-MM-DD.
        """

        timestamp = pd.to_datetime(value, errors="raise")

        return timestamp.strftime("%Y-%m-%d")

    @staticmethod
    def _to_bool(value: Any) -> bool:
        """
        Convert common boolean representations to Python bool.
        """

        if isinstance(value, bool):
            return value

        if isinstance(value, str):
            normalized = value.strip().lower()

            if normalized in {"true", "1", "yes", "y", "active"}:
                return True

            if normalized in {"false", "0", "no", "n", "inactive"}:
                return False

        if isinstance(value, Integral):
            return bool(value)

        if isinstance(value, Real):
            return bool(value)

        raise ValueError(
            f"Unable to convert value '{value}' to boolean."
        )