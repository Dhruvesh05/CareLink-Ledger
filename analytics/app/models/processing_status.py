"""
Processing states for the Analytics Layer pipeline.
"""

from enum import Enum


class ProcessingStatus(str, Enum):
    INGESTED = "INGESTED"
    ANALYZED = "ANALYZED"
    MAPPED = "MAPPED"
    TRANSFORMED = "TRANSFORMED"
    VALIDATED = "VALIDATED"
    VALIDATED_WITH_ERRORS = "VALIDATED_WITH_ERRORS"
    FHIR_GENERATED = "FHIR_GENERATED"