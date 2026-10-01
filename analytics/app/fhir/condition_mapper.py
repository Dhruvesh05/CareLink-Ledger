"""
Maps canonical condition data to FHIR R4 Condition resources.
"""

from __future__ import annotations

from typing import Any

import pandas as pd
from fhir.resources.condition import Condition
from fhir.resources.reference import Reference


class ConditionMapper:
    """
    Converts canonical condition data into a FHIR Condition resource.

    Expected canonical fields:
        patient_id
        condition

    Optional canonical fields:
        condition_code
        condition_system
        condition_status
    """

    def map_row(self, row: pd.Series) -> Condition | None:
        """
        Map condition-related fields from one canonical row.

        Returns:
            A FHIR Condition when condition data is present.
            None when no condition data is available.
        """

        patient_id = row.get("patient_id")
        condition = row.get("condition")

        if patient_id is None or pd.isna(patient_id):
            raise ValueError(
                "patient_id is required for FHIR Condition mapping."
            )

        if condition is None or pd.isna(condition):
            return None

        condition_text = str(condition).strip()

        if not condition_text:
            return None

        patient_reference = self._format_patient_id(patient_id)

        condition_data: dict[str, Any] = {
            "subject": Reference(
                reference=f"Patient/{patient_reference}"
            ),
            "code": {
                "text": condition_text,
            },
            "clinicalStatus": {
                "coding": [
                    {
                        "system": (
                            "http://terminology.hl7.org/"
                            "CodeSystem/condition-clinical"
                        ),
                        "code": "active",
                        "display": "Active",
                    }
                ]
            },
        }

        condition_code = row.get("condition_code")
        condition_system = row.get("condition_system")

        if condition_code is not None and not pd.isna(condition_code):
            coding: dict[str, str] = {
                "code": str(condition_code).strip(),
                "display": condition_text,
            }

            if condition_system is not None and not pd.isna(condition_system):
                coding["system"] = str(condition_system).strip()

            condition_data["code"] = {
                "coding": [coding],
                "text": condition_text,
            }

        condition_status = row.get("condition_status")

        if condition_status is not None and not pd.isna(condition_status):
            normalized_status = (
                str(condition_status).strip().lower()
            )

            condition_data["clinicalStatus"] = {
                "coding": [
                    {
                        "system": (
                            "http://terminology.hl7.org/"
                            "CodeSystem/condition-clinical"
                        ),
                        "code": normalized_status,
                        "display": normalized_status.capitalize(),
                    }
                ]
            }

        return Condition(**condition_data)

    @staticmethod
    def _format_patient_id(value: Any) -> str:
        """
        Prevent numeric patient IDs from becoming values such as 101.0.
        """

        if isinstance(value, float) and value.is_integer():
            return str(int(value))

        return str(value)