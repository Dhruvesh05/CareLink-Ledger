import io

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_analytics_routes_are_registered():
    routes = {route.path for route in app.routes}

    assert "/analytics/analyze" in routes
    assert "/analytics/map" in routes


def test_analyze_csv_returns_schema_and_validation():
    csv_content = (
        "patient_id,age,gender,weight,active\n"
        "1,25,male,65.5,true\n"
        "2,30,female,58.0,false\n"
        "3,40,other,72.0,true\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "patients.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "schema" in body
    assert "validation" in body

    assert body["schema"]["dataset_name"] == "patients.csv"

    validation = body["validation"]

    assert validation["total_rows"] == 3
    assert validation["valid_rows"] == 3
    assert validation["invalid_rows"] == 0
    assert validation["is_valid"] is True
    assert validation["quality_score"] == 100.0
    assert validation["quarantined_rows"] == []
    assert validation["errors"] == []
    assert validation["warnings"] == []


def test_analyze_csv_detects_invalid_required_value():
    csv_content = (
        "patient_id,age,gender,weight,active\n"
        "1,25,male,65.5,true\n"
        ",30,female,58.0,false\n"
        "3,40,other,72.0,true\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "invalid_patients.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    validation = response.json()["validation"]

    assert validation["total_rows"] == 3
    assert validation["valid_rows"] == 2
    assert validation["invalid_rows"] == 1
    assert validation["is_valid"] is False

    assert validation["quality_score"] == 66.67
    assert 1 in validation["quarantined_rows"]

    error_codes = {
        error["code"]
        for error in validation["errors"]
    }

    assert "NULL_REQUIRED_FIELD" in error_codes


def test_analyze_csv_returns_warning_for_unknown_gender():
    csv_content = (
        "patient_id,age,gender,weight,active\n"
        "1,25,male,65.5,true\n"
        "2,30,nonbinary,58.0,false\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "gender_warning.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    validation = response.json()["validation"]

    assert validation["total_rows"] == 2
    assert validation["invalid_rows"] == 0
    assert validation["is_valid"] is True
    assert validation["quality_score"] == 100.0

    warning_codes = {
        warning["code"]
        for warning in validation["warnings"]
    }

    assert "UNKNOWN_GENDER" in warning_codes


def test_analyze_rejects_unsupported_file_format():
    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "patients.txt",
                io.BytesIO(b"patient_id,age\n1,25"),
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert "Unsupported dataset format" in response.json()["detail"]


def test_analyze_rejects_empty_file():
    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "empty.csv",
                io.BytesIO(b""),
                "text/csv",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded dataset is empty."

def test_analyze_hospital_aliases_are_mapped_before_validation():
    csv_content = (
        "PatientID,PatientAge,Sex,BodyWeight\n"
        "1,25,male,65.5\n"
        "2,40,female,58.0\n"
        "3,60,other,72.3\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "hospital_a.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "schema" in body
    assert "mapping" in body
    assert "validation" in body

    mapping = body["mapping"]

    assert mapping["mapping_count"] == 4
    assert mapping["missing_required_fields"] == []

    validation = body["validation"]

    assert validation["total_rows"] == 3
    assert validation["valid_rows"] == 3
    assert validation["invalid_rows"] == 0
    assert validation["quality_score"] == 100.0
    assert validation["is_valid"] is True
    assert validation["errors"] == []

def test_analyze_hospital_aliases_detect_invalid_canonical_data():
    csv_content = (
        "PatientID,PatientAge,Sex,BodyWeight\n"
        "1,25,male,65.5\n"
        "2,150,female,58.0\n"
        "3,60,other,72.3\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "invalid_hospital.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    body = response.json()

    validation = body["validation"]

    assert validation["total_rows"] == 3
    assert validation["valid_rows"] == 2
    assert validation["invalid_rows"] == 1
    assert validation["quality_score"] == 66.67
    assert validation["is_valid"] is False

    error_codes = {
        error["code"]
        for error in validation["errors"]
    }

    assert "AGE_OUT_OF_RANGE" in error_codes

def test_analyze_returns_fhir_bundle_for_valid_hospital_data():
    csv_content = (
        "PatientID,PatientAge,Sex,BodyWeight\n"
        "1,25,male,65.5\n"
        "2,40,female,58.0\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "hospital_fhir.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "fhir" in body
    assert body["fhir"] is not None

    fhir = body["fhir"]

    assert fhir["resourceType"] == "Bundle"
    assert fhir["type"] == "collection"
    assert "entry" in fhir

    assert len(fhir["entry"]) == 4

    resource_types = [
        entry["resource"]["resourceType"]
        for entry in fhir["entry"]
    ]

    assert resource_types == [
        "Patient",
        "Observation",
        "Patient",
        "Observation",
    ]


def test_analyze_returns_null_fhir_for_invalid_hospital_data():
    csv_content = (
        "PatientID,PatientAge,Sex,BodyWeight\n"
        "1,25,male,65.5\n"
        "2,150,female,58.0\n"
    )

    response = client.post(
        "/analytics/analyze",
        files={
            "file": (
                "invalid_hospital_fhir.csv",
                io.BytesIO(csv_content.encode("utf-8")),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "fhir" in body
    assert body["fhir"] is None

    validation = body["validation"]

    assert validation["is_valid"] is False
    assert validation["invalid_rows"] == 1