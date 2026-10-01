"""
Transforms canonical healthcare data into FHIR R4 Bundles.
"""

from __future__ import annotations

import pandas as pd
from fhir.resources.bundle import Bundle

from app.fhir.bundle_builder import BundleBuilder
from app.fhir.condition_mapper import ConditionMapper
from app.fhir.observation_mapper import ObservationMapper
from app.fhir.patient_mapper import PatientMapper


class FHIRTransformationService:
    """
    Orchestrates transformation of canonical healthcare data
    into FHIR R4 resources and Bundles.

    Pipeline:
        Canonical DataFrame
            -> PatientMapper
            -> ObservationMapper
            -> ConditionMapper
            -> BundleBuilder
            -> FHIR Bundle
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

    def transform(
        self,
        dataframe: pd.DataFrame,
        bundle_type: str = "collection",
    ) -> Bundle:
        """
        Transform a canonical DataFrame into a FHIR Bundle.

        Each row represents one patient's canonical healthcare data.

        Args:
            dataframe:
                Canonical healthcare DataFrame.

            bundle_type:
                FHIR Bundle.type value.

        Returns:
            A FHIR R4 Bundle containing the mapped resources.
        """

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("dataframe must be a pandas DataFrame.")

        resources: list[object] = []

        for _, row in dataframe.iterrows():
            patient = self.patient_mapper.map_row(row)
            resources.append(patient)

            observation = self.observation_mapper.map_row(row)

            if observation is not None:
                resources.append(observation)

            condition = self.condition_mapper.map_row(row)

            if condition is not None:
                resources.append(condition)

        return self.bundle_builder.build(
            resources,
            bundle_type=bundle_type,
        )