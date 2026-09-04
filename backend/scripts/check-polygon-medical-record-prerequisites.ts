import dotenv from "dotenv";

dotenv.config();

import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD PREREQUISITES");
    console.log("========================================");

    const wallet = await polygon.wallet.getAddress();

    console.log("\n===== WALLET =====");
    console.log("Wallet:", wallet);

    console.log("\n===== PATIENT =====");

    console.log(
        "Patient active:",
        await polygon.patientRegistry.isPatientActive(wallet)
    );

    console.log(
        "Patient:",
        await polygon.patientRegistry.getPatient(wallet)
    );

    console.log("\n===== DOCTOR =====");

    console.log(
        "Doctor active:",
        await polygon.doctorRegistry.isDoctorActive(wallet)
    );

    console.log(
        "Doctor verified:",
        await polygon.doctorRegistry.isDoctorVerified(wallet)
    );

    console.log(
        "Doctor hospital:",
        await polygon.doctorRegistry.getDoctorHospital(wallet)
    );

    console.log(
        "Doctor:",
        await polygon.doctorRegistry.getDoctor(wallet)
    );

    console.log("\n===== HOSPITAL =====");

    console.log(
        "Hospital active:",
        await polygon.hospitalRegistry.isHospitalActive(wallet)
    );

    console.log(
        "Hospital verified:",
        await polygon.hospitalRegistry.isHospitalVerified(wallet)
    );

    console.log(
        "Hospital:",
        await polygon.hospitalRegistry.getHospital(wallet)
    );

    console.log("\n===== MEDICAL RECORD =====");

    console.log(
        "Total records:",
        (await polygon.medicalRecord.totalRecords()).toString()
    );

    console.log("\n========================================");
    console.log(" PREREQUISITE CHECK COMPLETE");
    console.log("========================================");
}

main().catch((error) => {
    console.error("\nPREREQUISITE CHECK FAILED");
    console.error(error);
    process.exit(1);
});
