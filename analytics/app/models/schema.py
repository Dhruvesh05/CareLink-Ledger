'''
Represents a dataset schema known to the platform.
'''
from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class Schema:

    schema_id: str
    hospital_id: str
    schema_name: str
    fingerprint: str
    mapping_version: str
    created_at: datetime = field(default_factory=datetime.utcnow)