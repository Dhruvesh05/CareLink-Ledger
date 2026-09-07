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
        throw new Error("DoctorRegistered event not found in ABI");
    }

    const topic = event.topicHash;

    const deploymentBlock = 45519074;
    const latestBlock = await provider.getBlockNumber();

    const CHUNK = 10;
    const CONCURRENCY = 50;

    console.log("========================================");
    console.log(" FAST POLYGON DOCTOR EVENT SEARCH");
    console.log("========================================");
    console.log("DoctorRegistry:", address);
    console.log("Topic:", topic);
    console.log("Deployment block:", deploymentBlock);
    console.log("Latest block:", latestBlock);
    console.log("Chunk size:", CHUNK);
    console.log("Concurrency:", CONCURRENCY);
    console.log();

    let current = deploymentBlock;
    let scannedBlocks = 0;
    const totalBlocks = latestBlock - deploymentBlock + 1;

    while (current <= latestBlock) {
        const requests: {
            fromBlock: number;
            toBlock: number;
        }[] = [];

        for (
            let i = 0;
            i < CONCURRENCY && current <= latestBlock;
            i++
        ) {
            const fromBlock = current;
            const toBlock = Math.min(
                fromBlock + CHUNK - 1,
                latestBlock
            );

            requests.push({
                fromBlock,
                toBlock,
            });

            current = toBlock + 1;
        }

        const results = await Promise.all(
            requests.map(async ({ fromBlock, toBlock }) => {
                try {
                    const logs = await provider.getLogs({
                        address,
                        topics: [topic],
                        fromBlock,
                        toBlock,
                    });

                    return {
                        fromBlock,
                        toBlock,
                        logs,
                        error: null,
                    };
                } catch (error: any) {
                    return {
                        fromBlock,
                        toBlock,
                        logs: [],
                        error: error?.message || String(error),
                    };
                }
            })
        );

        for (const result of results) {
            if (result.error) {
                console.error();
                console.error(
                    `RPC error ${result.fromBlock}-${result.toBlock}:`
                );
                console.error(result.error);
                console.error();

                process.exit(1);
            }

            if (result.logs.length > 0) {
                console.log();
                console.log("========================================");
                console.log(" DOCTOR REGISTRATION FOUND");
                console.log("========================================");

                for (const log of result.logs) {
                    const parsed = iface.parseLog({
                        topics: [...log.topics],
                        data: log.data,
                    });

                    if (!parsed) continue;

                    console.log("Block:", log.blockNumber);
                    console.log(
                        "Transaction:",
                        log.transactionHash
                    );
                    console.log("Log index:", log.index);
                    console.log();

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

                    console.log();
                }

                return;
            }
        }

        scannedBlocks += requests.length * CHUNK;

        const actualScanned = Math.min(
            scannedBlocks,
            totalBlocks
        );

        const percent =
            ((actualScanned / totalBlocks) * 100).toFixed(2);

        console.log(
            `Scanned through block ${requests[requests.length - 1].toBlock} ` +
            `(${percent}%)`
        );
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
