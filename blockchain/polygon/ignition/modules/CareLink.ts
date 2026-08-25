import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CareLink", (m) => {
  // Deploy AccessControl first
  const accessControl = m.contract("AccessControl");

  // Deploy registries
  const patientRegistry = m.contract("PatientRegistry", [
    accessControl,
  ]);

  const doctorRegistry = m.contract("DoctorRegistry", [
    accessControl,
  ]);

  const hospitalRegistry = m.contract("HospitalRegistry", [
    accessControl,
  ]);

  // Deploy AuditLog
  const auditLog = m.contract("AuditLog", [
    accessControl,
  ]);

  // Deploy MedicalRecord
  const medicalRecord = m.contract("MedicalRecord", [
    patientRegistry,
    doctorRegistry,
    hospitalRegistry,
    accessControl,
    auditLog,
  ]);

  // Wire PatientRegistry -> MedicalRecord
  m.call(
    patientRegistry,
    "setMedicalRecordContract",
    [medicalRecord]
  );

  // Wire AuditLog -> MedicalRecord
  m.call(
    auditLog,
    "setMedicalRecordContract",
    [medicalRecord]
  );

  return {
    accessControl,
    patientRegistry,
    doctorRegistry,
    hospitalRegistry,
    auditLog,
    medicalRecord,
  };
});