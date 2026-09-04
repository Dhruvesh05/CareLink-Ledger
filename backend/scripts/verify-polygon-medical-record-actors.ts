import dotenv from "dotenv";

dotenv.config();

import { BlockchainFactory } from "../src/blockchain/provider/BlockchainFactory";
import { polygon } from "../src/blockchain/polygon/config/polygon";

async function main() {
    process.env.BLOCKCHAIN_PROVIDER = "polygon";

    console.log("========================================");
    console.log(" POLYGON MEDICAL RECORD ACTOR VERIFICATION");
    console.log("========================================");

    const provider = BlockchainFactory.getProvider();

    const wallet = await polygon.wallet.getAddress();

    console.log("\n===== WALLET =====");
    console.log("Wallet:", wallet);

    console.log("\n===== BEFORE =====");

    console.log(
        "Doctor verified:",
        await polygon.doctorRegistry.isDoctorVerified(wallet)
    );

    console.log(
        "Hospital verified:",
        await polygon.hospitalRegistry.isHospitalVerified(wallet)
    );

    console.log("\n===== VERIFY DOCTOR =====");

    const doctorTx = await provider.verifyDoctor(wallet);

    console.log(
        "Doctor verification transaction mined."
    );

    if (doctorTx?.hash) {
        console.log("Tx hash:", doctorTx.hash);
    }

    console.log("\n===== VERIFY HOSPITAL =====");

    const hospitalTx = await provider.verifyHospital(wallet);

    console.log(
        "Hospital verification transaction mined."
    );

    if (hospitalTx?.hash) {
        console.log("Tx hash:", hospitalTx.hash);
    }

    console.log("\n===== AFTER =====");

    const doctorVerified =
        await polygon.doctorRegistry.isDoctorVerified(wallet);

    const hospitalVerified =
        await polygon.hospitalRegistry.isHospitalVerified(wallet);

    console.log(
        "Doctor verified:",
        doctorVerified
    );

    console.log(
        "Hospital verified:",
        hospitalVerified
    );

    if (!doctorVerified || !hospitalVerified) {
        throw new Error(
            "Actor verification failed."
        );
    }

    console.log("\n========================================");
    console.log(" ACTOR VERIFICATION PASSED");
    console.log("========================================");
}

main().catch((error) => {
    console.error("\n========================================");
    console.error(" ACTOR VERIFICATION FAILED");
    console.error("========================================");
    console.error(error);
    process.exit(1);
});
