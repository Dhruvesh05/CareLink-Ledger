import { ethers } from "ethers";

import AccessControlABI from "./abi/AccessControl.json";
import PatientRegistryABI from "./abi/PatientRegistry.json";
import DoctorRegistryABI from "./abi/DoctorRegistry.json";
import HospitalRegistryABI from "./abi/HospitalRegistry.json";
import AuditLogABI from "./abi/AuditLog.json";
import MedicalRecordABI from "./abi/MedicalRecord.json";

import { signer } from "./provider";
import { CONTRACTS } from "../../config/blockchain";

export const accessControl = new ethers.Contract(
  CONTRACTS.ACCESS_CONTROL,
  AccessControlABI.abi,
  signer
);

export const patientRegistry = new ethers.Contract(
  CONTRACTS.PATIENT_REGISTRY,
  PatientRegistryABI.abi,
  signer
);

export const doctorRegistry = new ethers.Contract(
  CONTRACTS.DOCTOR_REGISTRY,
  DoctorRegistryABI.abi,
  signer
);

export const hospitalRegistry = new ethers.Contract(
  CONTRACTS.HOSPITAL_REGISTRY,
  HospitalRegistryABI.abi,
  signer
);

export const auditLog = new ethers.Contract(
  CONTRACTS.AUDIT_LOG,
  AuditLogABI.abi,
  signer
);

export const medicalRecord = new ethers.Contract(
  CONTRACTS.MEDICAL_RECORD,
  MedicalRecordABI.abi,
  signer
);