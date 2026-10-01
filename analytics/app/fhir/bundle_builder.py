"""
Builds FHIR R4 Bundles from mapped healthcare resources.
"""

from __future__ import annotations

from typing import Iterable

from fhir.resources.bundle import Bundle


class BundleBuilder:
    """
    Builds a FHIR R4 Bundle containing healthcare resources.

    The builder accepts FHIR resources produced by the individual
    resource mappers, such as Patient, Observation, and Condition.
    """

    def build(
        self,
        resources: Iterable[object],
        bundle_type: str = "collection",
    ) -> Bundle:
        """
        Build a FHIR Bundle from the supplied resources.

        Args:
            resources:
                Iterable containing FHIR resource objects.

            bundle_type:
                FHIR Bundle.type value.
                Defaults to 'collection'.

        Returns:
            A validated FHIR R4 Bundle.
        """

        resource_list = list(resources)

        entries = [
            {
                "resource": resource,
            }
            for resource in resource_list
            if resource is not None
        ]

        return Bundle(
            type=bundle_type,
            entry=entries if entries else None,
        )