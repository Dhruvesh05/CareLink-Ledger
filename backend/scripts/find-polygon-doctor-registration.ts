import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import DoctorRegistryABI from "../src/blockchain/polygon/abi/DoctorRegistry.json";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC);

    const doctorRegistryAddress =
        process.env.POLYGON_DOCTOR_REGISTRY_ADDRESS ||
        "0xe92dfe6b5ce9116Cb7F8a6a0ce8e9e12b85244D5";

    const iface = new ethers.Interface(DoctorRegistryABI.abi);

    const event = iface.getEvent("DoctorRegistered");

    if (!event) {
        throw new Error("DoctorRegistered event not found in ABI");
    }

    const topic = event.topicHash;

    const deploymentBlock = 45519074;
    const latestBlock = await provider.getBlockNumber();

    console.log("========================================");
    console.log(" FINDING DOCTOR REGISTRATION EVENT");
    console.log("========================================");
    console.log("DoctorRegistry:", doctorRegistryAddress);
    console.log("Topic:", topic);
    console.log("Deployment block:", deploymentBlock);
    console.log("Latest block:", latestBlock);
    console.log();

    const CHUNK = 10;

    for (
        let fromBlock = deploymentBlock;
        fromBlock <= latestBlock;
        fromBlock += CHUNK
    ) {
        const toBlock = Math.min(
            fromBlock + CHUNK - 1,
            latestBlock
        );

        try {
            const logs = await provider.getLogs({
                address: doctorRegistryAddress,
                topics: [topic],
                fromBlock,
                toBlock,
            });

            if (logs.length > 0) {
                console.log("========================================");
                console.log(" FOUND DOCTOR REGISTRATION");
                console.log("========================================");

                for (const log of logs) {
                    const parsed = iface.parseLog({
                        topics: [...log.topics],
                        data: log.data,
                    });

                    if (!parsed) continue;

                    console.log("Block:", log.blockNumber);
                    console.log("Transaction:", log.transactionHash);
                    console.log("Log index:", log.index);
                    console.log();

                    console.log("Doctor ID:",
                        parsed.args.doctorId.toString()
                    );

                    console.log("Doctor wallet:",
                        parsed.args.wallet
                    );

                    console.log("Hospital:",
                        parsed.args.hospital
                    );

                    console.log("Timestamp:",
                        parsed.args.timestamp.toString()
                    );

                    console.log();
                }

                return;
            }
        } catch (error: any) {
            console.error(
                `RPC error for blocks ${fromBlock}-${toBlock}:`,
                error?.message || error
            );

            process.exit(1);
        }

        if ((fromBlock - deploymentBlock) % 10000 === 0) {
            console.log(
                `Scanned through block ${toBlock}...`
            );
        }
    }

    console.log();
    console.log("========================================");
    console.log(" NO DOCTOR REGISTRATION EVENT FOUND");
    console.log("========================================");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
