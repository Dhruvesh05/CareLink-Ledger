import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    console.log("========================================");
    console.log(" POLYGON AUDIT WIRING CHECK");
    console.log("========================================");

    console.log("AuditLog address:");
    console.log(await polygon.auditLog.getAddress());

    console.log();

    console.log("MedicalRecord address:");
    console.log(await polygon.medicalRecord.getAddress());

    console.log();

    const auditLog: any = polygon.auditLog;

    if (typeof auditLog.medicalRecordContract === "function") {
        const configured =
            await auditLog.medicalRecordContract();

        console.log("Configured MedicalRecord:");
        console.log(configured);

        console.log();

        console.log(
            "MATCH:",
            configured.toLowerCase() ===
            (await polygon.medicalRecord.getAddress()).toLowerCase()
        );
    } else {
        console.log(
            "AuditLog ABI does not expose medicalRecordContract()"
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
