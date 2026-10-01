import pandas as pd
import pytest

from app.services.fhir_transformation_service import (
    FHIRTransformationService,
)


def test_transforms_patient_data_to_fhir_bundle():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
        }
    )

    bundle = FHIRTransformationService().transform(dataframe)

    assert bundle.__resource_type__ == "Bundle"
    assert bundle.type == "collection"
    assert len(bundle.entry) == 1
    assert bundle.entry[0].resource.__resource_type__ == "Patient"
    assert bundle.entry[0].resource.id == "101"


def test_transforms_patient_and_observation():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
            "weight": [65.5],
        }
    )

    bundle = FHIRTransformationService().transform(dataframe)

    assert len(bundle.entry) == 2

    resource_types = [
        entry.resource.__resource_type__
        for entry in bundle.entry
    ]

    assert resource_types == [
        "Patient",
        "Observation",
    ]

    observation = bundle.entry[1].resource

    assert observation.subject.reference == "Patient/101"
    assert observation.valueQuantity.value == 65.5


def test_transforms_patient_observation_and_condition():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
            "weight": [65.5],
            "condition": ["Hypertension"],
        }
    )

    bundle = FHIRTransformationService().transform(dataframe)

    assert len(bundle.entry) == 3

    resource_types = [
        entry.resource.__resource_type__
        for entry in bundle.entry
    ]

    assert resource_types == [
        "Patient",
        "Observation",
        "Condition",
    ]

    condition = bundle.entry[2].resource

    assert condition.subject.reference == "Patient/101"
    assert condition.code.text == "Hypertension"


def test_transforms_multiple_patients():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101, 102],
            "weight": [65.5, 72.0],
            "condition": ["Hypertension", "Diabetes"],
        }
    )

    bundle = FHIRTransformationService().transform(dataframe)

    assert len(bundle.entry) == 6

    resource_types = [
        entry.resource.__resource_type__
        for entry in bundle.entry
    ]

    assert resource_types == [
        "Patient",
        "Observation",
        "Condition",
        "Patient",
        "Observation",
        "Condition",
    ]


def test_skips_missing_observation_and_condition():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
            "weight": [None],
            "condition": [None],
        }
    )

    bundle = FHIRTransformationService().transform(dataframe)

    assert len(bundle.entry) == 1
    assert bundle.entry[0].resource.__resource_type__ == "Patient"


def test_requires_dataframe():
    with pytest.raises(TypeError, match="pandas DataFrame"):
        FHIRTransformationService().transform(
            {"patient_id": [101]}
        )


def test_custom_bundle_type():
    dataframe = pd.DataFrame(
        {
            "patient_id": [101],
        }
    )

    bundle = FHIRTransformationService().transform(
        dataframe,
        bundle_type="batch",
    )

    assert bundle.type == "batch"