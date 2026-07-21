import dotenv from "dotenv";

dotenv.config();

export const env = {

    PORT: Number(process.env.PORT) || 5000,

    NODE_ENV: process.env.NODE_ENV || "development",

    MONGODB_URI: process.env.MONGODB_URI || "",

    JWT_SECRET: process.env.JWT_SECRET || "",

    ETHEREUM_NETWORK: process.env.ETHEREUM_NETWORK || "sepolia",

    ETHEREUM_RPC: process.env.ETHEREUM_RPC || "",

    PRIVATE_KEY: process.env.PRIVATE_KEY || "",

    ACCESS_CONTROL_ADDRESS:
        process.env.ACCESS_CONTROL_ADDRESS || "",

    PATIENT_REGISTRY_ADDRESS:
        process.env.PATIENT_REGISTRY_ADDRESS || "",

    DOCTOR_REGISTRY_ADDRESS:
        process.env.DOCTOR_REGISTRY_ADDRESS || "",

    HOSPITAL_REGISTRY_ADDRESS:
        process.env.HOSPITAL_REGISTRY_ADDRESS || "",

    AUDIT_LOG_ADDRESS:
        process.env.AUDIT_LOG_ADDRESS || "",

    MEDICAL_RECORD_ADDRESS:
        process.env.MEDICAL_RECORD_ADDRESS || "",

    PINATA_API_KEY:
        process.env.PINATA_API_KEY || "",

    PINATA_SECRET_KEY:
        process.env.PINATA_SECRET_KEY || "",

    PINATA_JWT:
        process.env.PINATA_JWT || "",

    POLYGON_RPC:
        process.env.POLYGON_RPC || "",

    POLYGON_NETWORK:
        process.env.POLYGON_NETWORK || "amoy",

    FABRIC_CHANNEL:
        process.env.FABRIC_CHANNEL || "",

    FABRIC_CHAINCODE:
        process.env.FABRIC_CHAINCODE || "",

    FABRIC_MSP:
        process.env.FABRIC_MSP || ""
};