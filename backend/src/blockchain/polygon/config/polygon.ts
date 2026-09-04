import path from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";

import AccessControlABI from "../abi/AccessControl.json";
import PatientRegistryABI from "../abi/PatientRegistry.json";
import DoctorRegistryABI from "../abi/DoctorRegistry.json";
import HospitalRegistryABI from "../abi/HospitalRegistry.json";
import AuditLogABI from "../abi/AuditLog.json";
import MedicalRecordABI from "../abi/MedicalRecord.json";

/*
==========================================================
ENVIRONMENT
==========================================================
*/

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const requiredEnvVars = [
    "POLYGON_RPC",
    "PRIVATE_KEY",
    "POLYGON_ACCESS_CONTROL_ADDRESS",
    "POLYGON_PATIENT_REGISTRY_ADDRESS",
    "POLYGON_DOCTOR_REGISTRY_ADDRESS",
    "POLYGON_HOSPITAL_REGISTRY_ADDRESS",
    "POLYGON_AUDIT_LOG_ADDRESS",
    "POLYGON_MEDICAL_RECORD_ADDRESS",
];

for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(
            `Missing required environment variable: ${key}`
        );
    }
}

/*
==========================================================
PROVIDER
==========================================================
*/

const provider = new ethers.JsonRpcProvider(
    process.env.POLYGON_RPC
);

/*
==========================================================
WALLET
==========================================================
*/

const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY!,
    provider
);

/*
==========================================================
POLYGON CONTRACTS
==========================================================
*/

export const polygon = {

    provider,

    wallet,

    accessControl:
        new ethers.Contract(
            process.env.POLYGON_ACCESS_CONTROL_ADDRESS!,
            AccessControlABI.abi,
            wallet
        ),

    patientRegistry:
        new ethers.Contract(
            process.env.POLYGON_PATIENT_REGISTRY_ADDRESS!,
            PatientRegistryABI.abi,
            wallet
        ),

    doctorRegistry:
        new ethers.Contract(
            process.env.POLYGON_DOCTOR_REGISTRY_ADDRESS!,
            DoctorRegistryABI.abi,
            wallet
        ),

    hospitalRegistry:
        new ethers.Contract(
            process.env.POLYGON_HOSPITAL_REGISTRY_ADDRESS!,
            HospitalRegistryABI.abi,
            wallet
        ),

    auditLog:
        new ethers.Contract(
            process.env.POLYGON_AUDIT_LOG_ADDRESS!,
            AuditLogABI.abi,
            wallet
        ),

    medicalRecord:
        new ethers.Contract(
            process.env.POLYGON_MEDICAL_RECORD_ADDRESS!,
            MedicalRecordABI.abi,
            wallet
        ),
};
