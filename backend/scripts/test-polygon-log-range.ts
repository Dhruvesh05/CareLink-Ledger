import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import DoctorRegistryABI from "../src/blockchain/polygon/abi/DoctorRegistry.json";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC);

    const address =
        process.env.POLYGON_DOCTOR_REGISTRY_ADDRESS ||
        "0xe92dfe6b5ce9116Cb7F8a6a0ce8e9e12b85244D5";

    const iface = new ethers.Interface(DoctorRegistryABI.abi);
    const event = iface.getEvent("DoctorRegistered");

    if (!event) {
        throw new Error("DoctorRegistered event not found");
    }

    const topic = event.topicHash;
    const latest = await provider.getBlockNumber();

    console.log("========================================");
    console.log(" POLYGON eth_getLogs RANGE TEST");
    console.log("========================================");
    console.log("Latest block:", latest);
    console.log("DoctorRegistry:", address);
    console.log("Topic:", topic);
    console.log();

    const ranges = [
        10,
        100,
        500,
        1000,
        5000,
        10000,
        50000,
        100000,
    ];

    for (const range of ranges) {
        const fromBlock = latest - range + 1;
        const toBlock = latest;

        const start = Date.now();

        try {
            const logs = await provider.getLogs({
                address,
                topics: [topic],
                fromBlock,
                toBlock,
            });

            const elapsed = Date.now() - start;

            console.log(
                `PASS  ${range.toString().padStart(6)} blocks | ` +
                `${elapsed} ms | logs: ${logs.length}`
            );

            if (logs.length > 0) {
                for (const log of logs) {
                    const parsed = iface.parseLog({
                        topics: [...log.topics],
                        data: log.data,
                    });

                    if (!parsed) continue;

                    console.log();
                    console.log("===== DOCTOR REGISTRATION FOUND =====");
                    console.log("Block:", log.blockNumber);
                    console.log("Transaction:", log.transactionHash);
                    console.log(
                        "Doctor ID:",
                        parsed.args.doctorId.toString()
                    );
                    console.log(
                        "Doctor wallet:",
                        parsed.args.wallet
                    );
                    console.log(
                        "Hospital:",
                        parsed.args.hospital
                    );
                    console.log(
                        "Timestamp:",
                        parsed.args.timestamp.toString()
                    );
                }
            }
        } catch (error: any) {
            console.log(
                `FAIL  ${range.toString().padStart(6)} blocks | ` +
                `${error?.message || error}`
            );
        }
    }

    console.log();
    console.log("========================================");
    console.log(" RANGE TEST COMPLETE");
    console.log("========================================");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
