import pytest

from fhir.resources.bundle import Bundle
from fhir.resources.condition import Condition
from fhir.resources.observation import Observation
from fhir.resources.patient import Patient
from fhir.resources.reference import Reference
from fhir.resources.quantity import Quantity

from app.fhir.bundle_builder import BundleBuilder


def test_builds_collection_bundle():
    patient = Patient(
        id="101",
        active=True,
    )

    bundle = BundleBuilder().build([patient])

    assert isinstance(bundle, Bundle)
    assert bundle.__resource_type__ == "Bundle"
    assert bundle.type == "collection"
    assert len(bundle.entry) == 1
    assert bundle.entry[0].resource.id == "101"


def test_builds_bundle_with_multiple_resources():
    patient = Patient(id="101")

    observation = Observation(
        status="final",
        subject=Reference(reference="Patient/101"),
        code={
            "text": "Body weight",
        },
        valueQuantity=Quantity(
            value=65.5,
            unit="kg",
            system="http://unitsofmeasure.org",
            code="kg",
        ),
    )

    condition = Condition(
        subject=Reference(reference="Patient/101"),
        code={
            "text": "Hypertension",
        },
        clinicalStatus={
            "coding": [
                {
                    "system": (
                        "http://terminology.hl7.org/"
                        "CodeSystem/condition-clinical"
                    ),
                    "code": "active",
                }
            ]
        },
    )

    bundle = BundleBuilder().build(
        [patient, observation, condition]
    )

    assert len(bundle.entry) == 3
    assert bundle.entry[0].resource.__resource_type__ == "Patient"
    assert bundle.entry[1].resource.__resource_type__ == "Observation"
    assert bundle.entry[2].resource.__resource_type__ == "Condition"


def test_ignores_none_resources():
    patient = Patient(id="101")

    bundle = BundleBuilder().build(
        [patient, None]
    )

    assert len(bundle.entry) == 1
    assert bundle.entry[0].resource.id == "101"


def test_empty_resource_list_creates_empty_bundle():
    bundle = BundleBuilder().build([])

    assert bundle.__resource_type__ == "Bundle"
    assert bundle.type == "collection"
    assert bundle.entry is None


def test_custom_bundle_type():
    patient = Patient(id="101")

    bundle = BundleBuilder().build(
        [patient],
        bundle_type="batch",
    )

    assert bundle.type == "batch"


def test_preserves_resource_objects():
    patient = Patient(
        id="101",
        active=True,
    )

    bundle = BundleBuilder().build([patient])

    assert bundle.entry[0].resource is patient