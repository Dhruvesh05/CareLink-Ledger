'''
Domain model representing a dataset uploaded by a registered hospital.
'''
from dataclasses import dataclass,field
from datetime import datetime

from apps.common.enums import (
    DatasetStatus,
    FileType,
)

@dataclass(slots=True)
class Dataset:
    dataset_id: str
    hospital_id: str
    dataset_name: str
    file_type: FileType

    schema_version: str
    fingerprint: str

    upload_timestamp: datetime = field(default_factory=datetime.utcnow)

    status: DatasetStatus = DatasetStatus.REGISTERED