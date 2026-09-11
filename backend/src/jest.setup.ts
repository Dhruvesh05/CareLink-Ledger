import { jest } from "@jest/globals";

process.env.BLOCKCHAIN_PROVIDER = "ethereum";
process.env.ETHEREUM_RPC = "http://127.0.0.1:8545";

/*
 * Test-only Ethereum configuration.
 * These are dummy values used only to allow modules/contracts
 * to initialize during Jest tests.
 */
process.env.PRIVATE_KEY =
    "0x59c6995e998f97a5a0044976f0945389dc9e86dae88a6a6b6f7f6f6f6f6f6f6f";

process.env.ACCESS_CONTROL_ADDRESS =
    "0x0000000000000000000000000000000000000001";

process.env.PATIENT_REGISTRY_ADDRESS =
    "0x0000000000000000000000000000000000000002";

process.env.DOCTOR_REGISTRY_ADDRESS =
    "0x0000000000000000000000000000000000000003";

process.env.HOSPITAL_REGISTRY_ADDRESS =
    "0x0000000000000000000000000000000000000004";

process.env.AUDIT_LOG_ADDRESS =
    "0x0000000000000000000000000000000000000005";

process.env.MEDICAL_RECORD_ADDRESS =
    "0x0000000000000000000000000000000000000006";

jest.mock("dotenv", () => ({
    config: jest.fn(),
}));

process.env.POLYGON_RPC = "http://127.0.0.1:8545";
process.env.POLYGON_MEDICAL_RECORD_ADDRESS =
    "0x0000000000000000000000000000000000000006";
