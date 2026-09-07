import path from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";

import { MedicalRecordPreflightService } from "../src/services/blockchain/MedicalRecordPreflightService";

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

async function main() {

    const walletAddress = process.argv[2];

    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD PREFLIGHT TEST");
    console.log("========================================");

    if (!walletAddress) {
        throw new Error(
            "Usage: npx tsx scripts/test-polygon-medical-record-preflight.ts <wallet>"
        );
    }

    if (!ethers.isAddress(walletAddress)) {
        throw new Error(
            "Invalid wallet address supplied."
        );
    }

    console.log();
    console.log("Wallet:", ethers.getAddress(walletAddress));

    const preflight =
        new MedicalRecordPreflightService();

    try {

        const result =
            await preflight.validateDoctor(
                walletAddress
            );

        console.log();
        console.log("===== PREFLIGHT RESULT =====");

        console.log(
            "Doctor:",
            result.doctor
        );

        console.log(
            "Role:",
            result.doctorRole
        );

        console.log(
            "Doctor active:",
            result.doctorActive
        );

        console.log(
            "Doctor verified:",
            result.doctorVerified
        );

        console.log(
            "Hospital:",
            result.hospital
        );

        console.log(
            "Hospital active:",
            result.hospitalActive
        );

        console.log(
            "Hospital verified:",
            result.hospitalVerified
        );

        console.log();
        console.log(
            "PASS: Medical Record doctor preflight succeeded."
        );

    } catch (error) {

        console.log();
        console.log("===== PREFLIGHT REJECTED =====");

        if (error instanceof Error) {
            console.log("Reason:", error.message);
        } else {
            console.log("Reason:", String(error));
        }

        process.exitCode = 1;
    }
}

main().catch((error) => {

    console.error();
    console.error("PREFLIGHT TEST ERROR:");

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});
