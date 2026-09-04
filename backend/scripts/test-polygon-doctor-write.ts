import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";
import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {

    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("========================================");
    console.log("   POLYGON DOCTOR WRITE-PATH TEST");
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
    STEP 1 — REGISTER DOCTOR
    ==========================================================
    */

    console.log("\n===== REGISTER DOCTOR =====");

    const fullNameHash =
        "0x" + "33".repeat(32);

    const licenseHash =
        "0x" + "44".repeat(32);

    const specialization = "Cardiology";

    /*
     * We use the current wallet as the hospital argument only
     * if the deployed contract accepts it as an address.
     */
    const hospital = wallet;

    console.log("Registering doctor...");

    const doctorTx =
        await provider.registerDoctor(
            fullNameHash,
            licenseHash,
            specialization,
            hospital
        );

    console.log("Doctor transaction mined.");
    console.log("Tx hash:", doctorTx?.hash);

    /*
    ==========================================================
    STEP 2 — READ DOCTOR
    ==========================================================
    */

    console.log("\n===== READ DOCTOR =====");

    const doctor =
        await provider.getDoctor(wallet);

    console.log("Doctor:", doctor);

    /*
    ==========================================================
    STEP 3 — DOCTOR STATUS
    ==========================================================
    */

    console.log("\n===== DOCTOR STATUS =====");

    const active =
        await provider.isDoctorActive(wallet);

    const verified =
        await provider.isDoctorVerified(wallet);

    console.log("Doctor active:", active);
    console.log("Doctor verified:", verified);

    /*
    ==========================================================
    STEP 4 — DOCTOR HOSPITAL
    ==========================================================
    */

    console.log("\n===== DOCTOR HOSPITAL =====");

    const doctorHospital =
        await provider.getDoctorHospital(wallet);

    console.log("Doctor hospital:", doctorHospital);

    /*
    ==========================================================
    STEP 5 — TOTAL DOCTORS
    ==========================================================
    */

    console.log("\n===== DOCTOR COUNT =====");

    const totalDoctors =
        await provider.totalDoctors();

    console.log(
        "Total doctors:",
        totalDoctors.toString()
    );

    /*
    ==========================================================
    STEP 6 — UPDATE SPECIALIZATION
    ==========================================================
    */

    console.log("\n===== UPDATE SPECIALIZATION =====");

    const updatedSpecialization =
        "Neurology";

    console.log(
        "Updating specialization to:",
        updatedSpecialization
    );

    const updateTx =
        await provider.updateSpecialization(
            updatedSpecialization
        );

    console.log("Specialization update mined.");
    console.log("Tx hash:", updateTx?.hash);

    /*
    ==========================================================
    STEP 7 — READ UPDATED DOCTOR
    ==========================================================
    */

    console.log("\n===== READ UPDATED DOCTOR =====");

    const updatedDoctor =
        await provider.getDoctor(wallet);

    console.log("Updated doctor:", updatedDoctor);

    console.log("\n========================================");
    console.log("   POLYGON DOCTOR WRITE TEST PASSED");
    console.log("========================================");
}

main().catch((error) => {

    console.error("\n========================================");
    console.error("   POLYGON DOCTOR WRITE TEST FAILED");
    console.error("========================================");

    console.error(error);

    process.exit(1);
});
