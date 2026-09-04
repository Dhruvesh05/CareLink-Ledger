import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";
import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {

    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("========================================");
    console.log("   POLYGON WRITE-PATH SMOKE TEST");
    console.log("========================================");

    const provider = BlockchainFactory.getProvider();

    const wallet = await polygon.wallet.getAddress();
    const network = await polygon.provider.getNetwork();
    const balance = await polygon.provider.getBalance(wallet);

    console.log("\n===== NETWORK =====");
    console.log("Chain ID:", network.chainId.toString());
    console.log("Wallet:", wallet);
    console.log("Balance:", balance.toString(), "wei");

    /*
    ==========================================================
    STEP 1 — REGISTER PATIENT
    ==========================================================
    */

    console.log("\n===== REGISTER PATIENT =====");

    const fullNameHash =
        "0x" + "11".repeat(32);

    const dobHash =
        "0x" + "22".repeat(32);

    const bloodGroup = "O+";
    const gender = "Male";

    console.log("Registering patient...");

    const patientTx =
        await provider.registerPatient(
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
        );

    console.log("Patient transaction mined.");
    console.log("Tx hash:", patientTx?.hash);

    /*
    ==========================================================
    STEP 2 — READ PATIENT
    ==========================================================
    */

    console.log("\n===== READ PATIENT =====");

    const patient =
        await provider.getPatient(wallet);

    console.log("Patient:", patient);

    const patientActive =
        await provider.isPatientActive(wallet);

    console.log("Patient active:", patientActive);

    /*
    ==========================================================
    STEP 3 — VERIFY PATIENT COUNT
    ==========================================================
    */

    console.log("\n===== PATIENT COUNT =====");

    const totalPatients =
        await provider.totalPatients();

    console.log(
        "Total patients:",
        totalPatients.toString()
    );

    console.log("\n========================================");
    console.log("   POLYGON WRITE SMOKE TEST PASSED");
    console.log("========================================");
}

main().catch((error) => {

    console.error("\n========================================");
    console.error("   POLYGON WRITE SMOKE TEST FAILED");
    console.error("========================================");

    console.error(error);

    process.exit(1);
});
