import dotenv from "dotenv";

dotenv.config();

import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD WIRING CHECK");
    console.log("========================================");

    const medicalRecordAddress =
        await polygon.medicalRecord.getAddress();

    const patientRegistryAddress =
        await polygon.patientRegistry.getAddress();

    const doctorRegistryAddress =
        await polygon.doctorRegistry.getAddress();

    const hospitalRegistryAddress =
        await polygon.hospitalRegistry.getAddress();

    const accessControlAddress =
        await polygon.accessControl.getAddress();

    const auditLogAddress =
        await polygon.auditLog.getAddress();

    console.log("\n===== DEPLOYED ADDRESSES =====");
    console.log("AccessControl:", accessControlAddress);
    console.log("PatientRegistry:", patientRegistryAddress);
    console.log("DoctorRegistry:", doctorRegistryAddress);
    console.log("HospitalRegistry:", hospitalRegistryAddress);
    console.log("AuditLog:", auditLogAddress);
    console.log("MedicalRecord:", medicalRecordAddress);

    console.log("\n===== MEDICAL RECORD DEPENDENCIES =====");

    console.log(
        "MedicalRecord.patientRegistry:",
        await polygon.medicalRecord.patientRegistry()
    );

    console.log(
        "MedicalRecord.doctorRegistry:",
        await polygon.medicalRecord.doctorRegistry()
    );

    console.log(
        "MedicalRecord.hospitalRegistry:",
        await polygon.medicalRecord.hospitalRegistry()
    );

    console.log(
        "MedicalRecord.accessControl:",
        await polygon.medicalRecord.accessControl()
    );

    console.log(
        "MedicalRecord.auditLog:",
        await polygon.medicalRecord.auditLog()
    );

    console.log("\n===== REGISTRY → MEDICAL RECORD =====");

    console.log(
        "PatientRegistry.medicalRecordContract:",
        await polygon.patientRegistry.medicalRecordContract()
    );

    console.log(
        "AuditLog.medicalRecordContract:",
        await polygon.auditLog.medicalRecordContract()
    );

    console.log("\n========================================");
    console.log(" EXPECTED");
    console.log("========================================");

    console.log(
        "PatientRegistry link OK:",
        (await polygon.patientRegistry.medicalRecordContract()).toLowerCase() ===
        medicalRecordAddress.toLowerCase()
    );

    console.log(
        "AuditLog link OK:",
        (await polygon.auditLog.medicalRecordContract()).toLowerCase() ===
        medicalRecordAddress.toLowerCase()
    );

    console.log("\n========================================");
    console.log(" WIRING CHECK COMPLETE");
    console.log("========================================");
}

main().catch((error) => {
    console.error("\nWIRING CHECK FAILED");
    console.error(error);
    process.exit(1);
});
