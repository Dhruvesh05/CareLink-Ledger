"""
Common enumerations used across the Analytics module.
"""

from enum import Enum


class HospitalStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class OrganisationType(str, Enum):
    HOSPITAL = "Hospital"
    CLINIC = "Clinic"
    LABORATORY = "Laboratory"
    RESEARCH_CENTER = "Research Center"
    OTHER = "Other"


class DatasetStatus(str, Enum):
    REGISTERED = "REGISTERED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class FileType(str, Enum):
    CSV = "csv"
    EXCEL = "xlsx"
    JSON = "json"
    PARQUET = "parquet"


class FHIRVersion(str, Enum):
    R4 = "R4"
    R5 = "R5"