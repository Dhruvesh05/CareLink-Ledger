import { ethers } from "ethers";

import AccessControlABI from "../abi/AccessControl.json";
import PatientRegistryABI from "../abi/PatientRegistry.json";
import DoctorRegistryABI from "../abi/DoctorRegistry.json";
import HospitalRegistryABI from "../abi/HospitalRegistry.json";
import AuditLogABI from "../abi/AuditLog.json";
import MedicalRecordABI from "../abi/MedicalRecord.json";

/**
 * Validate required environment variables
 */
const requiredEnvVars = [
    "ETHEREUM_RPC",
    "PRIVATE_KEY",
    "ACCESS_CONTROL_ADDRESS",
    "PATIENT_REGISTRY_ADDRESS",
    "DOCTOR_REGISTRY_ADDRESS",
    "HOSPITAL_REGISTRY_ADDRESS",
    "AUDIT_LOG_ADDRESS",
    "MEDICAL_RECORD_ADDRESS"
];

for (const key of requiredEnvVars) {

    if (!process.env[key]) {

        throw new Error(
            `Missing required environment variable: ${key}`
        );

    }

}

/**
 * Ethereum Provider
 */
const provider = new ethers.JsonRpcProvider(
    process.env.ETHEREUM_RPC!
);

/**
 * Deployer Wallet
 */
const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY!,
    provider
);

/**
 * Ethereum Contracts
 */
export const ethereum = {

    provider,

    wallet,

    accessControl:

        new ethers.Contract(
            process.env.ACCESS_CONTROL_ADDRESS!,
            AccessControlABI.abi,
            wallet
        ),

    patientRegistry:

        new ethers.Contract(
            process.env.PATIENT_REGISTRY_ADDRESS!,
            PatientRegistryABI.abi,
            wallet
        ),

    doctorRegistry:

        new ethers.Contract(
            process.env.DOCTOR_REGISTRY_ADDRESS!,
            DoctorRegistryABI.abi,
            wallet
        ),

    hospitalRegistry:

        new ethers.Contract(
            process.env.HOSPITAL_REGISTRY_ADDRESS!,
            HospitalRegistryABI.abi,
            wallet
        ),

    auditLog:

        new ethers.Contract(
            process.env.AUDIT_LOG_ADDRESS!,
            AuditLogABI.abi,
            wallet
        ),

    medicalRecord:

        new ethers.Contract(
            process.env.MEDICAL_RECORD_ADDRESS!,
            MedicalRecordABI.abi,
            wallet
        )

};

/**
 * Startup Information
 */
console.log("======================================");
console.log("Ethereum Provider Initialized");
console.log("Network           :", process.env.ETHEREUM_NETWORK);
console.log("RPC               :", process.env.ETHEREUM_RPC);
console.log("Wallet            :", wallet.address);
console.log("AccessControl     :", process.env.ACCESS_CONTROL_ADDRESS);
console.log("PatientRegistry   :", process.env.PATIENT_REGISTRY_ADDRESS);
console.log("DoctorRegistry    :", process.env.DOCTOR_REGISTRY_ADDRESS);
console.log("HospitalRegistry  :", process.env.HOSPITAL_REGISTRY_ADDRESS);
console.log("AuditLog          :", process.env.AUDIT_LOG_ADDRESS);
console.log("MedicalRecord     :", process.env.MEDICAL_RECORD_ADDRESS);
console.log("======================================");