import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";
import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {

    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("========================================");
    console.log("   POLYGON HOSPITAL WRITE-PATH TEST");
    console.log("========================================");

    const provider = BlockchainFactory.getProvider();

    const wallet = await polygon.wallet.getAddress();
    const network = await polygon.provider.getNetwork();
    const balance = await polygon.provider.getBalance(wallet);

    console.log("\n===== NETWORK =====");
    console.log("Chain ID:", network.chainId.toString());
    console.log("Network:", network.name);
    console.log("Wallet:", wallet);
    console.log("Balance:", balance.toString(), "wei");

    /*
    ==========================================================
    STEP 1 — REGISTER HOSPITAL
    ==========================================================
    */

    console.log("\n===== REGISTER HOSPITAL =====");

    const hospitalNameHash =
        "0x" + "55".repeat(32);

    const registrationNumberHash =
        "0x" + "66".repeat(32);

    const locationHash =
        "0x" + "77".repeat(32);

    console.log("Registering hospital...");

    const hospitalTx =
        await provider.registerHospital(
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );

    console.log("Hospital transaction mined.");
    console.log("Tx hash:", hospitalTx?.hash);

    /*
    ==========================================================
    STEP 2 — READ HOSPITAL
    ==========================================================
    */

    console.log("\n===== READ HOSPITAL =====");

    const hospital =
        await provider.getHospital(wallet);

    console.log("Hospital:", hospital);

    /*
    ==========================================================
    STEP 3 — HOSPITAL STATUS
    ==========================================================
    */

    console.log("\n===== HOSPITAL STATUS =====");

    const active =
        await provider.isHospitalActive(wallet);

    const verified =
        await provider.isHospitalVerified(wallet);

    console.log("Hospital active:", active);
    console.log("Hospital verified:", verified);

    /*
    ==========================================================
    STEP 4 — HOSPITAL COUNT
    ==========================================================
    */

    console.log("\n===== HOSPITAL COUNT =====");

    const totalHospitals =
        await provider.totalHospitals();

    console.log(
        "Total hospitals:",
        totalHospitals.toString()
    );

    /*
    ==========================================================
    STEP 5 — UPDATE LOCATION
    ==========================================================
    */

    console.log("\n===== UPDATE LOCATION =====");

    const updatedLocationHash =
        "0x" + "88".repeat(32);

    console.log("Updating hospital location...");

    const updateTx =
        await provider.updateLocation(
            updatedLocationHash
        );

    console.log("Location update mined.");
    console.log("Tx hash:", updateTx?.hash);

    /*
    ==========================================================
    STEP 6 — READ UPDATED HOSPITAL
    ==========================================================
    */

    console.log("\n===== READ UPDATED HOSPITAL =====");

    const updatedHospital =
        await provider.getHospital(wallet);

    console.log(
        "Updated hospital:",
        updatedHospital
    );

    console.log("\n========================================");
    console.log("   POLYGON HOSPITAL WRITE TEST PASSED");
    console.log("========================================");
}

main().catch((error) => {

    console.error("\n========================================");
    console.error("   POLYGON HOSPITAL WRITE TEST FAILED");
    console.error("========================================");

    console.error(error);

    process.exit(1);
});
