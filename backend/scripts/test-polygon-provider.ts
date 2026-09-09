import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";

async function main() {

    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("===== POLYGON PROVIDER SMOKE TEST =====");

    const provider = BlockchainFactory.getProvider();

    console.log("\n===== POLYGON PROVIDER CREATED =====");
    console.log("Provider:", provider.constructor.name);

    console.log("\n===== POLYGON READ TESTS =====");

    const polygonProvider = provider as typeof provider & {
        totalPatients(): Promise<any>;
    };

    console.log(
        "Total Patients:",
        await polygonProvider.totalPatients()
    );

    console.log(
        "Total Doctors:",
        await provider.totalDoctors()
    );

    console.log(
        "Total Hospitals:",
        await provider.totalHospitals()
    );

    console.log(
        "Total Medical Records:",
        await provider.totalRecords()
    );

    console.log(
        "Total Audit Logs:",
        await provider.totalAuditLogs()
    );

    console.log(
        "\n===== POLYGON PROVIDER SMOKE TEST PASSED ====="
    );
}

main().catch((error) => {

    console.error(
        "\n===== POLYGON PROVIDER SMOKE TEST FAILED ====="
    );

    console.error(error);

    process.exit(1);
});
