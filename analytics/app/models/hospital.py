'''
Domain model representing a healthcare instituition registered with the CareLink Ledger platform. It contains only business/domain information.
'''
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from app.common.enums import (
    FHIRVersion,
    HospitalStatus,
    OrganisationType,
)

@dataclass(slots=True)
class Hospital:
    hospital_id: str
    hospital_name: str
    organization_type: OrganisationType
    fhir_version: FHIRVersion = FHIRVersion.R4

    status: HospitalStatus = HospitalStatus.ACTIVE

    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)