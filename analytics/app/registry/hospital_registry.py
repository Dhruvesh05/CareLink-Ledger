'''
Registry responsible for managing registered hospitals
'''
from app.models.hospital import Hospital
from app.registry.base_registry import BaseRegistry

class HospitalRegistry(BaseRegistry[Hospital]):

    def register(self, hospital: Hospital) -> None:
        super().register (
            hospital.hospital_id,
            hospital,
        )