import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD WIRING CHECK");
    console.log("========================================");

    const medicalRecordAddress =
        await polygon.medicalRecord.getAddress();

    console.log("MedicalRecord:");
    console.log(medicalRecordAddress);

    console.log();

    const patientRegistry: any = polygon.patientRegistry;

    console.log("PatientRegistry:");
    console.log(await patientRegistry.getAddress());

    console.log();

    if (typeof patientRegistry.medicalRecordContract === "function") {
        const configured =
            await patientRegistry.medicalRecordContract();

        console.log("Configured MedicalRecord:");
        console.log(configured);

        console.log();

        console.log(
            "MATCH:",
            configured.toLowerCase() ===
            medicalRecordAddress.toLowerCase()
        );
    } else {
        console.log(
            "ERROR: patientRegistry.medicalRecordContract() is unavailable"
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
