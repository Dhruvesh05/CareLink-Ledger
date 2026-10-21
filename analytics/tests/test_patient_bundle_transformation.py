
import pandas as pd
import pytest

from app.services.fhir_transformation_service import FHIRTransformationService


def _resources(bundle):
    return [
        entry.resource
        for entry in (bundle.entry or [])
        if entry.resource is not None
    ]


def _resource_data(resource):
    return resource.model_dump(mode="json", exclude_none=True)


def test_creates_one_bundle_per_patient():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 101, 102],
            "weight": [65.5, 66.0, 72.0],
            "condition": ["Hypertension", "Diabetes", "Asthma"],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)

    assert set(bundles.keys()) == {"101", "102"}
    assert len(bundles) == 2


def test_repeated_rows_share_one_patient_resource():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 101],
            "weight": [65.5, 66.0],
            "condition": ["Hypertension", "Diabetes"],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)
    resources = _resources(bundles["101"])

    patient_resources = [
        resource
        for resource in resources
        if _resource_data(resource).get("resourceType") == "Patient"
    ]

    assert len(patient_resources) == 1
    assert patient_resources[0].id == "101"


def test_clinical_resources_reference_the_correct_patient():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 101, 102],
            "weight": [65.5, 66.0, 72.0],
            "condition": ["Hypertension", "Diabetes", "Asthma"],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)

    for patient_id, bundle in bundles.items():
        for resource in _resources(bundle):
            data = _resource_data(resource)
            resource_type = data.get("resourceType")

            if resource_type == "Observation":
                assert data["subject"]["reference"] == f"Patient/{patient_id}"

            elif resource_type == "Condition":
                assert data["subject"]["reference"] == f"Patient/{patient_id}"


def test_each_bundle_contains_only_its_patient():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 102],
            "weight": [65.5, 72.0],
            "condition": ["Hypertension", "Asthma"],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)

    for patient_id, bundle in bundles.items():
        resources = _resources(bundle)
        patient_resources = [
            resource
            for resource in resources
            if _resource_data(resource).get("resourceType") == "Patient"
        ]

        assert len(patient_resources) == 1
        assert patient_resources[0].id == patient_id

        for resource in resources:
            data = _resource_data(resource)
            resource_type = data.get("resourceType")

            if resource_type in {"Observation", "Condition"}:
                assert data["subject"]["reference"] == f"Patient/{patient_id}"


def test_numeric_float_patient_ids_are_normalized():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101.0],
            "weight": [65.5],
            "condition": ["Hypertension"],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)

    assert list(bundles.keys()) == ["101"]

    resources = _resources(bundles["101"])
    patient = next(
        resource
        for resource in resources
        if _resource_data(resource).get("resourceType") == "Patient"
    )

    assert patient.id == "101"

    for resource in resources:
        data = _resource_data(resource)

        if data.get("resourceType") in {"Observation", "Condition"}:
            assert data["subject"]["reference"] == "Patient/101"


def test_patient_bundle_has_id_and_collection_type():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
            "weight": [65.5],
        }
    )

    bundles = FHIRTransformationService().transform_patient_bundles(dataframe)
    bundle = bundles["101"]

    assert bundle.id
    assert bundle.type == "collection"


def test_rejects_input_without_patient_id_column():
    dataframe = pd.DataFrame({"weight": [65.5]})

    with pytest.raises(ValueError, match="patient_id"):
        FHIRTransformationService().transform_patient_bundles(dataframe)
