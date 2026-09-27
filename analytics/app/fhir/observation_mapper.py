"""
Maps canonical observation data to FHIR R4 Observation resources.
"""

from __future__ import annotations

from numbers import Integral, Real
from typing import Any

import pandas as pd
from fhir.resources.observation import Observation
from fhir.resources.reference import Reference
from fhir.resources.quantity import Quantity


class ObservationMapper:
    """
    Converts canonical observation data into a FHIR Observation resource.

    Current canonical observation field:
        weight
    """

    def map_row(self, row: pd.Series) -> Observation | None:
        """
        Map observation-related fields from one canonical row.

        Returns:
            A FHIR Observation when an observation value is present.
            None when no observation data is available.
        """

        patient_id = row.get("patient_id")
        weight = row.get("weight")

        if patient_id is None or pd.isna(patient_id):
            raise ValueError(
                "patient_id is required for FHIR Observation mapping."
            )

        if weight is None or pd.isna(weight):
            return None

        numeric_weight = self._to_number(weight)

        observation_data: dict[str, Any] = {
            "status": "final",
            "subject": Reference(
                reference=f"Patient/{self._format_patient_id(patient_id)}"
            ),
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "29463-7",
                        "display": "Body weight",
                    }
                ],
                "text": "Body weight",
            },
            "valueQuantity": Quantity(
                value=numeric_weight,
                unit="kg",
                system="http://unitsofmeasure.org",
                code="kg",
            ),
        }

        return Observation(**observation_data)

    @staticmethod
    def _to_number(value: Any) -> float:
        """
        Convert numeric-compatible values to float.
        """

        if isinstance(value, Integral):
            return float(value)

        if isinstance(value, Real):
            return float(value)

        if isinstance(value, str):
            try:
                return float(value.strip())
            except ValueError as exc:
                raise ValueError(
                    f"Unable to convert value '{value}' to a number."
                ) from exc

        raise ValueError(
            f"Unable to convert value '{value}' to a number."
        )

    @staticmethod
    def _format_patient_id(value: Any) -> str:
        """
        Convert patient identifiers to a clean FHIR reference ID.
        """
        
        if isinstance(value, Integral):
            return str(int(value))

        if isinstance(value, Real):
            if float(value).is_integer():
                return str(int(value))

        return str(value).strip()