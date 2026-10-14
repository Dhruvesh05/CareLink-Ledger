from datetime import datetime, timezone

import pandas as pd

from app.schemas.analytics_handoff import AnalyticsHandoffV1
from app.services.analytics_pipeline_service import AnalyticsPipelineService


def _example_bundle():
    return {
        "resourceType": "Bundle",
        "id": "bundle-123",
        "type": "collection",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": "101",
                    "identifier": [{"system": "source", "value": "source-101"}],
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "id": "obs-1",
                    "status": "final",
                    "code": {"text": "weight"},
                    "subject": {"reference": "Patient/101"},
                }
            },
        ],
    }


def _example_validation_result():
    class Result:
        is_valid = True
        quality_score = 100.0
        total_rows = 2
        valid_rows = 2
        invalid_rows = 0
        errors = []
        warnings = []
        quarantined_rows = 0

    return Result()


def test_valid_handoff_parses_and_uses_camel_case():
    valid = AnalyticsHandoffV1.model_validate(
        {
            "contractVersion": "1.0",
            "processing": {
                "processingId": "proc-1",
                "datasetId": "dataset-1",
                "datasetName": "example.csv",
                "processedAt": datetime.now(timezone.utc).isoformat(),
                "status": "FHIR_GENERATED",
                "schemaFingerprint": "fingerprint-123",
                "schemaVersion": "1.0",
            },
            "validation": {
                "validationStatus": "PASSED",
                "qualityScore": 100.0,
                "totalRows": 2,
                "validRows": 2,
                "invalidRows": 0,
                "errorCount": 0,
                "warningCount": 0,
                "quarantinedRows": 0,
            },
            "patient": {
                "sourcePatientId": "source-101",
                "fhirPatientId": "101",
            },
            "artifact": {
                "artifactType": "FHIR_R4_BUNDLE",
                "bundleId": "bundle-123",
                "resourceCount": 2,
                "resourceTypes": ["Patient", "Observation"],
                "sha256": AnalyticsHandoffV1.compute_bundle_sha256(_example_bundle()),
                "bundle": _example_bundle(),
            },
            "provenance": {
                "sourceFormat": "CSV",
                "mappingComplete": True,
            },
        }
    )

    serialized = valid.model_dump(mode="json", by_alias=True, exclude_none=True)
    assert serialized["contractVersion"] == "1.0"
    assert serialized["processing"]["processingId"] == "proc-1"
    assert serialized["patient"]["fhirPatientId"] == "101"


def test_invalid_contract_version_is_rejected():
    try:
        AnalyticsHandoffV1.model_validate(
            {
                "contractVersion": "2.0",
                "processing": {
                    "processingId": "proc-1",
                    "datasetId": "dataset-1",
                    "datasetName": "example.csv",
                    "processedAt": datetime.now(timezone.utc).isoformat(),
                    "status": "FHIR_GENERATED",
                    "schemaFingerprint": "fingerprint-123",
                    "schemaVersion": "1.0",
                },
                "validation": {
                    "validationStatus": "PASSED",
                    "qualityScore": 100.0,
                    "totalRows": 1,
                    "validRows": 1,
                    "invalidRows": 0,
                    "errorCount": 0,
                    "warningCount": 0,
                    "quarantinedRows": 0,
                },
                "patient": {
                    "sourcePatientId": "source-101",
                    "fhirPatientId": "101",
                },
                "artifact": {
                    "artifactType": "FHIR_R4_BUNDLE",
                    "bundleId": "bundle-123",
                    "resourceCount": 1,
                    "resourceTypes": ["Patient"],
                    "sha256": "a" * 64,
                    "bundle": {
                        "resourceType": "Bundle",
                        "id": "bundle-123",
                        "type": "collection",
                        "entry": [{
                            "resource": {
                                "resourceType": "Patient",
                                "id": "101",
                            }
                        }],
                    },
                },
                "provenance": {
                    "sourceFormat": "CSV",
                    "mappingComplete": True,
                },
            }
        )
    except Exception:
        return
    raise AssertionError("Unsupported handoff version should be rejected")


def test_pipeline_creates_one_handoff_per_valid_patient():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 101, 202],
            "weight": [65.5, 66.0, 72.0],
            "condition": ["Hypertension", "Diabetes", "Asthma"],
        }
    )

    result = AnalyticsPipelineService().process(
        dataframe,
        dataset_name="patients.csv",
        schema_version="hospital-schema-1",
    )

    assert set(result["handoffs"].keys()) == {"101", "202"}
    assert result["handoffs"]["101"]["patient"]["fhirPatientId"] == "101"
    assert result["handoffs"]["202"]["patient"]["fhirPatientId"] == "202"
    assert result["handoffs"]["101"]["validation"]["validationStatus"] == "PASSED"


def test_handoff_integrity_fails_when_bundle_is_modified():
    handoff = AnalyticsHandoffV1.from_patient_bundle(
        source_patient_id="source-101",
        fhir_patient_id="101",
        bundle=_example_bundle(),
        processing_id="proc-1",
        dataset_id="dataset-1",
        dataset_name="example.csv",
        schema_fingerprint="fingerprint-123",
        schema_version="hospital-schema-1",
        validation_result=_example_validation_result(),
        source_format="CSV",
        mapping_complete=True,
    ).model_dump(mode="json", by_alias=True)

    handoff["artifact"]["bundle"]["entry"][1]["resource"]["status"] = "amended"

    try:
        AnalyticsHandoffV1.model_validate(handoff)
    except ValueError:
        return
    raise AssertionError("Modified Bundle content must fail integrity validation")


def test_handoff_rejects_duplicate_patient_resources():
    bundle = _example_bundle()
    bundle["entry"].insert(1, {"resource": bundle["entry"][0]["resource"].copy()})

    try:
        AnalyticsHandoffV1.from_patient_bundle(
            source_patient_id="source-101",
            fhir_patient_id="101",
            bundle=bundle,
            processing_id="proc-1",
            dataset_id="dataset-1",
            dataset_name="example.csv",
            schema_fingerprint="fingerprint-123",
            schema_version="hospital-schema-1",
            validation_result=_example_validation_result(),
            source_format="CSV",
            mapping_complete=True,
        )
    except ValueError:
        return
    raise AssertionError("Duplicate Patient resources must be rejected")


def test_handoff_rejects_cross_patient_clinical_references():
    bundle = _example_bundle()
    bundle["entry"][1]["resource"]["subject"]["reference"] = "Patient/202"

    try:
        AnalyticsHandoffV1.from_patient_bundle(
            source_patient_id="source-101",
            fhir_patient_id="101",
            bundle=bundle,
            processing_id="proc-1",
            dataset_id="dataset-1",
            dataset_name="example.csv",
            schema_fingerprint="fingerprint-123",
            schema_version="hospital-schema-1",
            validation_result=_example_validation_result(),
            source_format="CSV",
            mapping_complete=True,
        )
    except ValueError:
        return
    raise AssertionError("Cross-patient clinical references must be rejected")


def test_invalid_dataset_has_no_successful_handoffs():
    dataframe = pd.DataFrame(
        {
            "PatientID": [1, 2],
            "PatientAge": [25, 150],
            "Sex": ["male", "female"],
        }
    )

    result = AnalyticsPipelineService().process(
        dataframe,
        dataset_name="invalid.csv",
        schema_version="hospital-schema-1",
    )

    assert result["handoffs"] == {}
    assert result["processing_metadata"].status != "FHIR_GENERATED"


def test_handoff_uses_original_source_identifier_and_shared_processing_id():
    dataframe = pd.DataFrame(
        {
            "PatientID": [101, 202],
            "PatientAge": [25, 40],
            "Sex": ["male", "female"],
        }
    )

    result = AnalyticsPipelineService().process(
        dataframe,
        dataset_name="patients.csv",
        schema_version="hospital-schema-1",
    )
    handoffs = result["handoffs"]

    assert handoffs["101"]["patient"]["sourcePatientId"] == "101"
    assert handoffs["202"]["patient"]["sourcePatientId"] == "202"
    assert (
        handoffs["101"]["processing"]["processingId"]
        == handoffs["202"]["processing"]["processingId"]
    )


def test_same_dataset_reprocessing_preserves_dataset_identity():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
            "age": [25],
            "gender": ["male"],
        }
    )
    service = AnalyticsPipelineService()

    first = service.process(
        dataframe,
        dataset_name="patients.csv",
        schema_version="hospital-schema-1",
    )
    second = service.process(
        dataframe,
        dataset_name="patients.csv",
        schema_version="hospital-schema-1",
    )

    assert (
        first["handoffs"]["101"]["processing"]["datasetId"]
        == second["handoffs"]["101"]["processing"]["datasetId"]
    )
    assert (
        first["handoffs"]["101"]["processing"]["processingId"]
        != second["handoffs"]["101"]["processing"]["processingId"]
    )
