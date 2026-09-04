import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";
import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD WRITE-PATH TEST");
    console.log("========================================");

    const provider = BlockchainFactory.getProvider();

    const wallet = await polygon.wallet.getAddress();

    console.log("\n===== WALLET =====");
    console.log("Wallet:", wallet);

    /*
    ==========================================================
    STEP 1 — VERIFY PREREQUISITES
    ==========================================================
    */

    console.log("\n===== PREREQUISITES =====");

    const patientActive =
        await polygon.patientRegistry.isPatientActive(wallet);

    const doctorActive =
        await polygon.doctorRegistry.isDoctorActive(wallet);

    const doctorVerified =
        await polygon.doctorRegistry.isDoctorVerified(wallet);

    const hospital =
        await polygon.doctorRegistry.getDoctorHospital(wallet);

    const hospitalActive =
        await polygon.hospitalRegistry.isHospitalActive(hospital);

    const hospitalVerified =
        await polygon.hospitalRegistry.isHospitalVerified(hospital);

    console.log("Patient active:", patientActive);
    console.log("Doctor active:", doctorActive);
    console.log("Doctor verified:", doctorVerified);
    console.log("Doctor hospital:", hospital);
    console.log("Hospital active:", hospitalActive);
    console.log("Hospital verified:", hospitalVerified);

    if (
        !patientActive ||
        !doctorActive ||
        !doctorVerified ||
        !hospitalActive ||
        !hospitalVerified
    ) {
        throw new Error(
            "MedicalRecord prerequisites are not satisfied."
        );
    }

    /*
    ==========================================================
    STEP 2 — CAPTURE COUNTERS BEFORE
    ==========================================================
    */

    console.log("\n===== COUNTERS BEFORE =====");

    const recordsBefore =
        await polygon.medicalRecord.totalRecords();

    const patientCountBefore =
        await polygon.patientRegistry.getRecordCount(wallet);

    const doctorRecordsBefore =
        await polygon.medicalRecord.getDoctorRecords(wallet);

    const hospitalRecordsBefore =
        await polygon.medicalRecord.getHospitalRecords(hospital);

    console.log(
        "Total records:",
        recordsBefore.toString()
    );

    console.log(
        "Patient record count:",
        patientCountBefore.toString()
    );

    console.log(
        "Doctor record IDs:",
        doctorRecordsBefore
    );

    console.log(
        "Hospital record IDs:",
        hospitalRecordsBefore
    );

    /*
    ==========================================================
    STEP 3 — CREATE MEDICAL RECORD
    ==========================================================
    */

    const ipfsHash =
        "ipfs://polygon-medical-record-test-001";

    const fileHash =
        "sha256:polygon-medical-record-test-001";

    const category =
        "Cardiology";

    const emergency = false;

    console.log("\n===== CREATE MEDICAL RECORD =====");

    console.log("Patient:", wallet);
    console.log("IPFS hash:", ipfsHash);
    console.log("File hash:", fileHash);
    console.log("Category:", category);
    console.log("Emergency:", emergency);

    console.log("Creating medical record...");

    const tx = await polygon.medicalRecord.createMedicalRecord(
        wallet,
        ipfsHash,
        fileHash,
        category,
        emergency
    );

    const receipt = await tx.wait();

    if (!receipt) {
        throw new Error(
            "MedicalRecord transaction receipt was not returned."
        );
    }

    console.log("Medical record transaction mined.");
    console.log("Tx hash:", tx.hash);

    /*
    ==========================================================
    STEP 4 — EXTRACT RECORD ID
    ==========================================================
    */

    let recordId: bigint | undefined;

    for (const log of receipt.logs) {
        try {
            const parsed =
                polygon.medicalRecord.interface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });

            if (
                parsed &&
                parsed.name === "RecordCreated"
            ) {
                recordId = parsed.args.recordId;
                break;
            }
        } catch {
            // Ignore logs belonging to other contracts.
        }
    }

    if (recordId === undefined) {
        throw new Error(
            "RecordCreated event was not found."
        );
    }

    console.log(
        "Created record ID:",
        recordId.toString()
    );

    /*
    ==========================================================
    STEP 5 — READ RECORD
    ==========================================================
    */

    console.log("\n===== READ MEDICAL RECORD =====");

    const record =
        await polygon.medicalRecord.getMedicalRecord(
            recordId
        );

    console.log("Record:", record);

    /*
    ==========================================================
    STEP 6 — VERIFY RECORD
    ==========================================================
    */

    console.log("\n===== VERIFY RECORD =====");

    const recordExists =
        await polygon.medicalRecord.recordExists(
            recordId
        );

    console.log(
        "Record exists:",
        recordExists
    );

    if (!recordExists) {
        throw new Error(
            "Created record does not exist."
        );
    }

    if (record.patient !== wallet) {
        throw new Error(
            `Patient mismatch: ${record.patient}`
        );
    }

    if (record.doctor !== wallet) {
        throw new Error(
            `Doctor mismatch: ${record.doctor}`
        );
    }

    if (record.hospital.toLowerCase() !== hospital.toLowerCase()) {
        throw new Error(
            `Hospital mismatch: ${record.hospital}`
        );
    }

    if (record.ipfsHash !== ipfsHash) {
        throw new Error(
            `IPFS hash mismatch: ${record.ipfsHash}`
        );
    }

    if (record.fileHash !== fileHash) {
        throw new Error(
            `File hash mismatch: ${record.fileHash}`
        );
    }

    if (record.category !== category) {
        throw new Error(
            `Category mismatch: ${record.category}`
        );
    }

    if (record.active !== true) {
        throw new Error(
            "New medical record is not active."
        );
    }

    if (record.emergency !== emergency) {
        throw new Error(
            "Emergency flag mismatch."
        );
    }

    if (record.version !== 1n) {
        throw new Error(
            `Unexpected initial version: ${record.version}`
        );
    }

    /*
    ==========================================================
    STEP 7 — VERIFY COUNTERS
    ==========================================================
    */

    console.log("\n===== COUNTERS AFTER =====");

    const recordsAfter =
        await polygon.medicalRecord.totalRecords();

    const patientCountAfter =
        await polygon.patientRegistry.getRecordCount(wallet);

    const doctorRecordsAfter =
        await polygon.medicalRecord.getDoctorRecords(wallet);

    const hospitalRecordsAfter =
        await polygon.medicalRecord.getHospitalRecords(hospital);

    console.log(
        "Total records:",
        recordsAfter.toString()
    );

    console.log(
        "Patient record count:",
        patientCountAfter.toString()
    );

    console.log(
        "Doctor record IDs:",
        doctorRecordsAfter
    );

    console.log(
        "Hospital record IDs:",
        hospitalRecordsAfter
    );

    if (recordsAfter !== recordsBefore + 1n) {
        throw new Error(
            `Total records did not increment correctly: ${recordsBefore} -> ${recordsAfter}`
        );
    }

    if (patientCountAfter !== patientCountBefore + 1n) {
        throw new Error(
            `Patient record count did not increment correctly: ${patientCountBefore} -> ${patientCountAfter}`
        );
    }

    /*
    ==========================================================
    STEP 8 — VERIFY AUDIT LOG
    ==========================================================
    */

    console.log("\n===== AUDIT LOG =====");

    const auditIds =
        await polygon.auditLog.getRecordAuditLogs(
            recordId
        );

    console.log(
        "Audit log IDs:",
        auditIds
    );

    if (auditIds.length === 0) {
        throw new Error(
            "No audit log was created for the medical record."
        );
    }

    let createAuditFound = false;

    for (const auditId of auditIds) {
        const audit =
            await polygon.auditLog.getAudit(
                auditId
            );

        console.log(
            `Audit ${auditId.toString()}:`,
            audit
        );

        /*
         * AuditLog.Action.CREATE_RECORD is enum value 0
         * in the CareLink contract.
         */
        if (
            audit.recordId === recordId &&
            audit.performedBy.toLowerCase() === wallet.toLowerCase() &&
            audit.action === 0n
        ) {
            createAuditFound = true;
        }
    }

    if (!createAuditFound) {
        throw new Error(
            "CREATE_RECORD audit entry was not found."
        );
    }

    /*
    ==========================================================
    FINAL
    ==========================================================
    */

    console.log("\n========================================");
    console.log(" POLYGON MEDICAL RECORD WRITE TEST PASSED");
    console.log("========================================");

    console.log("\nRecord ID:", recordId.toString());
    console.log("Transaction:", tx.hash);
    console.log("Audit logs:", auditIds.length);
}

main().catch((error) => {
    console.error("\n========================================");
    console.error(" POLYGON MEDICAL RECORD WRITE TEST FAILED");
    console.error("========================================");
    console.error(error);
    process.exit(1);
});
