import dotenv from "dotenv";

dotenv.config();

function getString(
    value: string | undefined,
    fallback = ""
): string {
    return value?.trim() || fallback;
}

function getNumber(
    value: string | undefined,
    fallback: number
): number {
    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : fallback;
}

export const env = {
    PORT: getNumber(
        process.env.PORT,
        5000
    ),

    NODE_ENV: getString(
        process.env.NODE_ENV,
        "development"
    ),

    MONGODB_URI: getString(
        process.env.MONGODB_URI
    ),

    JWT_SECRET: getString(
        process.env.JWT_SECRET
    ),

    ETHEREUM_NETWORK: getString(
        process.env.ETHEREUM_NETWORK,
        "sepolia"
    ),

    ETHEREUM_RPC: getString(
        process.env.ETHEREUM_RPC
    ),

    PRIVATE_KEY: getString(
        process.env.PRIVATE_KEY
    ),

    ACCESS_CONTROL_ADDRESS: getString(
        process.env.ACCESS_CONTROL_ADDRESS
    ),

    PATIENT_REGISTRY_ADDRESS: getString(
        process.env.PATIENT_REGISTRY_ADDRESS
    ),

    DOCTOR_REGISTRY_ADDRESS: getString(
        process.env.DOCTOR_REGISTRY_ADDRESS
    ),

    HOSPITAL_REGISTRY_ADDRESS: getString(
        process.env.HOSPITAL_REGISTRY_ADDRESS
    ),

    AUDIT_LOG_ADDRESS: getString(
        process.env.AUDIT_LOG_ADDRESS
    ),

    MEDICAL_RECORD_ADDRESS: getString(
        process.env.MEDICAL_RECORD_ADDRESS
    ),

    /*
    ==========================================================
    IPFS
    ==========================================================
    */

    IPFS_HOST: getString(
        process.env.IPFS_HOST,
        "127.0.0.1"
    ),

    IPFS_PORT: getNumber(
        process.env.IPFS_PORT,
        5001
    ),

    IPFS_PROTOCOL: getString(
        process.env.IPFS_PROTOCOL,
        "http"
    ),

    IPFS_TIMEOUT_MS: getNumber(
        process.env.IPFS_TIMEOUT_MS,
        30_000
    ),

    IPFS_MAX_UPLOAD_SIZE_BYTES: getNumber(
        process.env.IPFS_MAX_UPLOAD_SIZE_BYTES,
        50 * 1024 * 1024
    ),

    IPFS_ALLOWED_MIME_TYPES: getString(
        process.env.IPFS_ALLOWED_MIME_TYPES
    ),

    /*
    ==========================================================
    PINATA
    ==========================================================
    */

    PINATA_API_KEY: getString(
        process.env.PINATA_API_KEY
    ),

    PINATA_SECRET_KEY: getString(
        process.env.PINATA_SECRET_KEY
    ),

    PINATA_JWT: getString(
        process.env.PINATA_JWT
    ),

    PINATA_GATEWAY_URL: getString(
        process.env.PINATA_GATEWAY_URL,
        "https://gateway.pinata.cloud/ipfs"
    ),

    /*
    ==========================================================
    POLYGON
    ==========================================================
    */

    POLYGON_RPC: getString(
        process.env.POLYGON_RPC
    ),

    POLYGON_NETWORK: getString(
        process.env.POLYGON_NETWORK,
        "amoy"
    ),

    /*
    ==========================================================
    FABRIC
    ==========================================================
    */

    FABRIC_CHANNEL: getString(
        process.env.FABRIC_CHANNEL
    ),

    FABRIC_CHAINCODE: getString(
        process.env.FABRIC_CHAINCODE
    ),

    FABRIC_MSP: getString(
        process.env.FABRIC_MSP
    )
};