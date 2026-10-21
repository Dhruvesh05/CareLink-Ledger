
"""
Transforms canonical healthcare data into patient-level FHIR R4 Bundles.
"""

from __future__ import annotations

from collections import defaultdict
from hashlib import sha256
import json

import pandas as pd
from fhir.resources.bundle import Bundle

from app.fhir.bundle_builder import BundleBuilder
from app.fhir.condition_mapper import ConditionMapper
from app.fhir.observation_mapper import ObservationMapper
from app.fhir.patient_id import normalize_patient_id
from app.fhir.patient_mapper import PatientMapper


class FHIRTransformationService:
    """
    Transforms canonical healthcare records into FHIR R4 Bundles.

    The legacy transform() method returns one combined Bundle.
    transform_patient_bundles() returns one Bundle per patient.
    """

    def __init__(
        self,
        patient_mapper: PatientMapper | None = None,
        observation_mapper: ObservationMapper | None = None,
        condition_mapper: ConditionMapper | None = None,
        bundle_builder: BundleBuilder | None = None,
    ) -> None:
        self.patient_mapper = patient_mapper or PatientMapper()
        self.observation_mapper = observation_mapper or ObservationMapper()
        self.condition_mapper = condition_mapper or ConditionMapper()
        self.bundle_builder = bundle_builder or BundleBuilder()

    @staticmethod
    def _validate_dataframe(dataframe: pd.DataFrame) -> None:
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        if "patient_id" not in dataframe.columns:
            raise ValueError("dataframe must contain a 'patient_id' column.")

    @staticmethod
    def _serialize_resource(resource: object) -> dict:
        return resource.model_dump(mode="json", exclude_none=True)

    @classmethod
    def _generate_bundle_id(cls, resources: list[object]) -> str:
        """
        Generate a deterministic Bundle ID from the ordered resource content.

        The final handoff hash should be calculated from the actual serialized
        Bundle, including its final ID.
        """
        resource_data = [
            cls._serialize_resource(resource)
            for resource in resources
        ]
        canonical_content = json.dumps(
            resource_data,
            sort_keys=True,
            separators=(",", ":"),
        )
        digest = sha256(canonical_content.encode("utf-8")).hexdigest()
        return f"bundle-{digest[:32]}"

    def transform_patient_bundles(
        self,
        dataframe: pd.DataFrame,
    ) -> dict[str, Bundle]:
        """
        Return one FHIR collection Bundle per normalized patient ID.

        Repeated rows share a Patient resource and Bundle. Distinct clinical
        resources from each row are retained.
        """
        self._validate_dataframe(dataframe)

        resources_by_patient: dict[str, list[object]] = defaultdict(list)
        patients_by_id: dict[str, object] = {}

        for _, row in dataframe.iterrows():
            patient_id = normalize_patient_id(row.get("patient_id"))

            # These are the actual mapper method names in this project.
            patient = self.patient_mapper.map_row(row)

            if patient is not None:
                existing_patient = patients_by_id.get(patient_id)

                if existing_patient is None:
                    patients_by_id[patient_id] = patient
                    resources_by_patient[patient_id].append(patient)
                elif (
                    self._serialize_resource(existing_patient)
                    != self._serialize_resource(patient)
                ):
                    raise ValueError(
                        f"Conflicting Patient data for patient ID "
                        f"{patient_id!r}."
                    )

            observation = self.observation_mapper.map_row(row)
            if observation is not None:
                resources_by_patient[patient_id].append(observation)

            condition = self.condition_mapper.map_row(row)
            if condition is not None:
                resources_by_patient[patient_id].append(condition)

        bundles: dict[str, Bundle] = {}

        for patient_id, resources in resources_by_patient.items():
            if patient_id not in patients_by_id:
                raise ValueError(
                    f"No Patient resource was generated for patient "
                    f"ID {patient_id!r}."
                )

            bundle = self.bundle_builder.build(
                resources,
                bundle_type="collection",
            )
            bundle.id = self._generate_bundle_id(resources)
            bundles[patient_id] = bundle

        return bundles

    def transform(
        self,
        dataframe: pd.DataFrame,
        bundle_type: str = "collection",
    ) -> Bundle:
        """
        Preserve the existing single-Bundle interface.

        Existing callers can continue using transform(). New integration
        code should use transform_patient_bundles() for patient-level output.
        """
        self._validate_dataframe(dataframe)

        patient_bundles = self.transform_patient_bundles(dataframe)
        resources: list[object] = []

        for bundle in patient_bundles.values():
            for entry in bundle.entry or []:
                if entry.resource is not None:
                    resources.append(entry.resource)

        return self.bundle_builder.build(
            resources,
            bundle_type=bundle_type,
        )
