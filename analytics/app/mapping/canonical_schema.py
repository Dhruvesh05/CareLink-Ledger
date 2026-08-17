"""
Canonical schema definition for the CareLink Analytics Layer.

This module defines the standard fields expected by the analytics
layer after hospital-specific datasets have been mapped.
"""

from dataclasses import dataclass
from typing import Dict, Tuple


@dataclass(frozen=True)
class CanonicalField:
    """
    Represents one field in the CareLink canonical schema.
    """

    name: str
    data_type: str
    required: bool
    aliases: Tuple[str, ...] = ()


CANONICAL_FIELDS: Dict[str, CanonicalField] = {
    "patient_id": CanonicalField(
        name="patient_id",
        data_type="integer",
        required=True,
        aliases=(
            "patientid",
            "patient_id",
            "patient id",
            "patient-number",
            "patient_number",
        ),
    ),

    "date_of_birth": CanonicalField(
        name="date_of_birth",
        data_type="date",
        required=False,
        aliases=(
            "dob",
            "dateofbirth",
            "date_of_birth",
            "date of birth",
            "birth_date",
            "birthdate",
        ),
    ),

    "age": CanonicalField(
        name="age",
        data_type="integer",
        required=False,
        aliases=(
            "age",
            "patientage",
            "patient_age",
            "patient age",
        ),
    ),

    "gender": CanonicalField(
        name="gender",
        data_type="categorical",
        required=False,
        aliases=(
            "gender",
            "sex",
            "patient_gender",
            "patient gender",
        ),
    ),

    "weight": CanonicalField(
        name="weight",
        data_type="decimal",
        required=False,
        aliases=(
            "weight",
            "bodyweight",
            "body_weight",
            "body weight",
            "patient_weight",
        ),
    ),

    "active": CanonicalField(
        name="active",
        data_type="boolean",
        required=False,
        aliases=(
            "active",
            "status",
            "patient_status",
            "patient status",
            "is_active",
            "isactive",
        ),
    ),

    "diagnosis": CanonicalField(
        name="diagnosis",
        data_type="string",
        required=False,
        aliases=(
            "diagnosis",
            "primary_diagnosis",
            "primary diagnosis",
            "primary_disease",
            "primary disease",
        ),
    ),

    "hospital": CanonicalField(
        name="hospital",
        data_type="string",
        required=False,
        aliases=(
            "hospital",
            "hospital_name",
            "hospital name",
            "facility",
            "facility_name",
        ),
    ),
}


def get_canonical_field(field_name: str) -> CanonicalField:
    """
    Retrieve a canonical field definition by name.

    Raises:
        KeyError: If the canonical field does not exist.
    """

    try:
        return CANONICAL_FIELDS[field_name]
    except KeyError as exc:
        raise KeyError(
            f"Unknown canonical field: {field_name}"
        ) from exc


def get_canonical_fields() -> Dict[str, CanonicalField]:
    """
    Return all canonical field definitions.
    """

    return CANONICAL_FIELDS.copy()