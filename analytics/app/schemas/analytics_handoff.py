"""Version 1 contract for transferring patient-level FHIR artifacts."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, ClassVar, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

CONTRACT_VERSION = "1.0"
SUPPORTED_SOURCE_FORMATS = {"CSV", "XLSX", "XLS", "JSON"}


def to_camel(value: str) -> str:
    """Convert Python snake_case names to JSON camelCase."""
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ContractModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class ProcessingInfo(ContractModel):
    processing_id: str = Field(min_length=1)
    dataset_id: str = Field(min_length=1)
    dataset_name: str = Field(min_length=1)
    processed_at: datetime
    status: Literal["FHIR_GENERATED"]
    schema_fingerprint: str = Field(min_length=1)
    schema_version: str = Field(min_length=1)


class ValidationInfo(ContractModel):
    validation_status: Literal["PASSED"]
    quality_score: float = Field(ge=0, le=100)
    total_rows: int = Field(ge=0)
    valid_rows: int = Field(ge=0)
    invalid_rows: int = Field(ge=0)
    error_count: int = Field(ge=0)
    warning_count: int = Field(ge=0)
    quarantined_rows: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_row_counts(self) -> "ValidationInfo":
        if self.valid_rows + self.invalid_rows != self.total_rows:
            raise ValueError(
                "validRows + invalidRows must equal totalRows"
            )
        return self


class PatientInfo(ContractModel):
    source_patient_id: str = Field(min_length=1)
    fhir_patient_id: str = Field(min_length=1)


class ArtifactInfo(ContractModel):
    artifact_type: Literal["FHIR_R4_BUNDLE"]
    bundle_id: str = Field(min_length=1)
    resource_count: int = Field(ge=1)
    resource_types: list[str] = Field(min_length=1)
    sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    bundle: dict[str, Any]

    @model_validator(mode="after")
    def validate_bundle(self) -> "ArtifactInfo":
        bundle = self.bundle

        if bundle.get("resourceType") != "Bundle":
            raise ValueError("artifact.bundle must be a FHIR Bundle")

        if bundle.get("id") != self.bundle_id:
            raise ValueError("bundleId must match artifact.bundle.id")

        entries = bundle.get("entry") or []
        if not isinstance(entries, list) or len(entries) != self.resource_count:
            raise ValueError(
                "resourceCount must match the number of Bundle entries"
            )

        actual_types = {
            entry.get("resource", {}).get("resourceType")
            for entry in entries
            if isinstance(entry, dict)
            and isinstance(entry.get("resource"), dict)
        }

        if None in actual_types or len(actual_types) == 0:
            raise ValueError(
                "Every Bundle entry must contain a typed resource"
            )

        if len(self.resource_types) != len(set(self.resource_types)):
            raise ValueError("resourceTypes must not contain duplicates")

        if set(self.resource_types) != actual_types:
            raise ValueError(
                "resourceTypes must match the resource types in the Bundle"
            )

        if self.sha256 != AnalyticsHandoffV1.compute_bundle_sha256(bundle):
            raise ValueError("sha256 must match the serialized Bundle")

        return self


class ProvenanceInfo(ContractModel):
    source_format: Literal["CSV", "XLSX", "XLS", "JSON"]
    mapping_complete: bool


class AnalyticsHandoffV1(ContractModel):
    CONTRACT_VERSION: ClassVar[str] = CONTRACT_VERSION

    contract_version: Literal["1.0"]
    processing: ProcessingInfo
    validation: ValidationInfo
    patient: PatientInfo
    artifact: ArtifactInfo
    provenance: ProvenanceInfo

    @staticmethod
    def canonicalize_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
        """Return a canonical JSON-compatible copy for hashing and validation."""
        if not isinstance(bundle, dict):
            raise ValueError("Bundle payload must be a dictionary")
        payload = json.loads(json.dumps(bundle, sort_keys=True))
        return payload

    @staticmethod
    def compute_bundle_sha256(bundle: dict[str, Any]) -> str:
        """Compute a reproducible SHA-256 for a final serialized FHIR Bundle."""
        canonical = AnalyticsHandoffV1.canonicalize_bundle(bundle)
        return sha256(
            json.dumps(canonical, separators=(",", ":"), sort_keys=True).encode(
                "utf-8"
            )
        ).hexdigest()

    @classmethod
    def from_patient_bundle(
        cls,
        *,
        source_patient_id: str,
        fhir_patient_id: str,
        bundle: dict[str, Any],
        processing_id: str,
        dataset_id: str,
        dataset_name: str,
        processed_at: datetime | None = None,
        status: str = "FHIR_GENERATED",
        schema_fingerprint: str,
        schema_version: str,
        validation_result: Any,
        source_format: str,
        mapping_complete: bool,
    ) -> "AnalyticsHandoffV1":
        """Create a validated handoff from a patient-level FHIR Bundle."""
        if status != "FHIR_GENERATED":
            raise ValueError("status must be FHIR_GENERATED for a successful handoff")

        if not validation_result.is_valid:
            raise ValueError("A successful handoff requires a valid dataset")

        if source_format not in SUPPORTED_SOURCE_FORMATS:
            raise ValueError(f"Unsupported source format: {source_format!r}")

        serialized_bundle = cls.canonicalize_bundle(bundle)
        bundle_id = serialized_bundle.get("id")
        if not bundle_id:
            raise ValueError("Bundle id is required for a patient handoff")

        resource_entries = serialized_bundle.get("entry") or []
        if not isinstance(resource_entries, list):
            raise ValueError("Bundle entry list is required")

        resource_types = sorted(
            {
                entry.get("resource", {}).get("resourceType")
                for entry in resource_entries
                if isinstance(entry, dict)
                and isinstance(entry.get("resource"), dict)
                and entry["resource"].get("resourceType")
            }
        )

        artifact_payload = {
            "artifactType": "FHIR_R4_BUNDLE",
            "bundleId": bundle_id,
            "resourceCount": len(resource_entries),
            "resourceTypes": resource_types,
            "sha256": cls.compute_bundle_sha256(serialized_bundle),
            "bundle": serialized_bundle,
        }

        payload = {
            "contractVersion": CONTRACT_VERSION,
            "processing": {
                "processingId": processing_id,
                "datasetId": dataset_id,
                "datasetName": dataset_name,
                "processedAt": (processed_at or datetime.now(timezone.utc)).isoformat(),
                "status": status,
                "schemaFingerprint": schema_fingerprint,
                "schemaVersion": schema_version,
            },
            "validation": {
                "validationStatus": "PASSED",
                "qualityScore": float(validation_result.quality_score),
                "totalRows": int(validation_result.total_rows),
                "validRows": int(validation_result.valid_rows),
                "invalidRows": int(validation_result.invalid_rows),
                "errorCount": int(len(validation_result.errors)),
                "warningCount": int(len(validation_result.warnings)),
                "quarantinedRows": int(
                    len(getattr(validation_result, "quarantined_rows", []))
                    if isinstance(getattr(validation_result, "quarantined_rows", []), list)
                    else getattr(validation_result, "quarantined_rows", 0)
                ),
            },
            "patient": {
                "sourcePatientId": source_patient_id,
                "fhirPatientId": fhir_patient_id,
            },
            "artifact": artifact_payload,
            "provenance": {
                "sourceFormat": source_format,
                "mappingComplete": bool(mapping_complete),
            },
        }
        return cls.model_validate(payload)

    @model_validator(mode="after")
    def validate_patient_reference(self) -> "AnalyticsHandoffV1":
        entries = self.artifact.bundle.get("entry") or []
        patient_resource_ids = {
            entry["resource"].get("id")
            for entry in entries
            if isinstance(entry, dict)
            and isinstance(entry.get("resource"), dict)
            and entry["resource"].get("resourceType") == "Patient"
        }

        patient_resource_count = sum(
            1
            for entry in entries
            if isinstance(entry, dict)
            and isinstance(entry.get("resource"), dict)
            and entry["resource"].get("resourceType") == "Patient"
        )
        if patient_resource_count != 1:
            raise ValueError(
                "Bundle must contain exactly one Patient resource"
            )

        if self.patient.fhir_patient_id not in patient_resource_ids:
            raise ValueError(
                "patient.fhirPatientId must identify a Patient "
                "resource in artifact.bundle"
            )

        if len(patient_resource_ids) != 1 or self.patient.fhir_patient_id not in patient_resource_ids:
            raise ValueError(
                "Bundle must contain exactly one Patient resource for the intended patient"
            )

        for entry in entries:
            resource = entry.get("resource") if isinstance(entry, dict) else None
            if not isinstance(resource, dict):
                continue
            resource_type = resource.get("resourceType")
            if resource_type in {"Observation", "Condition", "MedicationStatement", "Procedure", "Encounter", "DiagnosticReport", "AllergyIntolerance", "DocumentReference"}:
                for subject_key in ("subject", "patient"):
                    reference = resource.get(subject_key)
                    if isinstance(reference, dict):
                        ref_value = reference.get("reference")
                        if ref_value and ref_value != f"Patient/{self.patient.fhir_patient_id}":
                            raise ValueError(
                                "Clinical resources must reference the intended Patient"
                            )
        return self
