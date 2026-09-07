import path from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";

import { PolygonTransactionBuilder } from "../src/blockchain/polygon/transactions/PolygonTransactionBuilder";
import MedicalRecordABI from "../src/blockchain/polygon/abi/MedicalRecord.json";

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const builder =
    new PolygonTransactionBuilder();

const patient =
    "0x1111111111111111111111111111111111111111";

const ipfsHash =
    "bafybeigdyrzt5examplecid";

const fileHash =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const category =
    "General";

const emergency =
    false;

const transaction =
    builder.buildCreateMedicalRecordTransaction(
        patient,
        ipfsHash,
        fileHash,
        category,
        emergency
    );

console.log("===== TRANSACTION BUILDER TEST =====");

console.log("Chain ID:", transaction.chainId);
console.log("To:", transaction.to);
console.log("Value:", transaction.value);
console.log("Data length:", transaction.data.length);
console.log("Data prefix:", transaction.data.slice(0, 10));

const expectedAddress =
    process.env.POLYGON_MEDICAL_RECORD_ADDRESS;

if (!expectedAddress) {
    throw new Error(
        "POLYGON_MEDICAL_RECORD_ADDRESS is missing"
    );
}

if (
    transaction.to.toLowerCase() !==
    expectedAddress.toLowerCase()
) {
    throw new Error(
        "Transaction target does not match MedicalRecord contract"
    );
}

if (transaction.chainId !== 80002) {
    throw new Error(
        "Incorrect Polygon Amoy chain ID"
    );
}

const iface =
    new ethers.Interface(
        MedicalRecordABI.abi
    );

const decoded =
    iface.decodeFunctionData(
        "createMedicalRecord",
        transaction.data
    );

console.log("Decoded patient:", decoded[0]);
console.log("Decoded IPFS hash:", decoded[1]);
console.log("Decoded file hash:", decoded[2]);
console.log("Decoded category:", decoded[3]);
console.log("Decoded emergency:", decoded[4]);

if (
    decoded[0].toLowerCase() !==
    patient.toLowerCase()
) {
    throw new Error(
        "Decoded patient does not match input"
    );
}

if (decoded[1] !== ipfsHash) {
    throw new Error(
        "Decoded IPFS hash does not match input"
    );
}

if (decoded[2] !== fileHash) {
    throw new Error(
        "Decoded file hash does not match input"
    );
}

if (decoded[3] !== category) {
    throw new Error(
        "Decoded category does not match input"
    );
}

if (decoded[4] !== emergency) {
    throw new Error(
        "Decoded emergency does not match input"
    );
}

console.log();
console.log("PASS: transaction calldata is correct.");
