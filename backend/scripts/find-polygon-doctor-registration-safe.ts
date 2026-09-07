import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import DoctorRegistryABI from "../src/blockchain/polygon/abi/DoctorRegistry.json";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const provider = new ethers.JsonRpcProvider(
        process.env.POLYGON_RPC
    );

    const address =
        process.env.POLYGON_DOCTOR_REGISTRY_ADDRESS ||
        "0xe92dfe6b5ce9116Cb7F8a6a0ce8e9e12b85244D5";

    const iface = new ethers.Interface(
        DoctorRegistryABI.abi
    );

    const event = iface.getEvent("DoctorRegistered");

    if (!event) {
        throw new Error(
            "DoctorRegistered event not found in ABI"
        );
    }

    const topic = event.topicHash;

    const deploymentBlock = 45519074;
    const latestBlock = await provider.getBlockNumber();

    const CHUNK = 10;

    // Keep this LOW for Alchemy Free tier.
    const CONCURRENCY = 2;

    // Delay between batches.
    const DELAY_MS = 500;

    const totalBlocks =
        latestBlock - deploymentBlock + 1;

    const totalRequests =
        Math.ceil(totalBlocks / CHUNK);

    let current = deploymentBlock;
    let completedRequests = 0;

    const startTime = Date.now();

    console.log("========================================");
    console.log(" SAFE POLYGON DOCTOR EVENT SEARCH");
    console.log("========================================");
    console.log("DoctorRegistry:", address);
    console.log("Topic:", topic);
    console.log("Deployment block:", deploymentBlock);
    console.log("Latest block:", latestBlock);
    console.log("Total blocks:", totalBlocks);
    console.log("Total requests:", totalRequests);
    console.log("Concurrency:", CONCURRENCY);
    console.log("Delay:", `${DELAY_MS} ms`);
    console.log();

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
                toBlock
            });

            current = toBlock + 1;
        }

        let found = false;

        for (const request of requests) {

            let attempt = 0;

            while (true) {
                attempt++;

                try {
                    const logs =
                        await provider.getLogs({
                            address,
                            topics: [topic],
                            fromBlock: request.fromBlock,
                            toBlock: request.toBlock
                        });

                    completedRequests++;

                    if (logs.length > 0) {

                        console.log();
                        console.log(
                            "========================================"
                        );
                        console.log(
                            " DOCTOR REGISTRATION FOUND"
                        );
                        console.log(
                            "========================================"
                        );

                        for (const log of logs) {

                            const parsed =
                                iface.parseLog({
                                    topics: [
                                        ...log.topics
                                    ],
                                    data: log.data
                                });

                            if (!parsed) {
                                continue;
                            }

                            console.log(
                                "Block:",
                                log.blockNumber
                            );

                            console.log(
                                "Transaction:",
                                log.transactionHash
                            );

                            console.log(
                                "Log index:",
                                log.index
                            );

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

                        found = true;
                        break;
                    }

                    break;

                } catch (error: any) {

                    const message =
                        error?.message ||
                        String(error);

                    if (
                        message.includes("429") ||
                        message.includes(
                            "compute units per second"
                        )
                    ) {

                        const retryDelay =
                            Math.min(
                                5000 * attempt,
                                30000
                            );

                        console.log(
                            `429 on ` +
                            `${request.fromBlock}-${request.toBlock}. ` +
                            `Retrying in ` +
                            `${retryDelay} ms...`
                        );

                        await sleep(retryDelay);

                        continue;
                    }

                    throw error;
                }
            }

            if (found) {
                return;
            }

            await sleep(DELAY_MS);
        }

        const elapsed =
            (Date.now() - startTime) / 1000;

        const requestsPerSecond =
            completedRequests / elapsed;

        const remaining =
            totalRequests - completedRequests;

        const etaSeconds =
            requestsPerSecond > 0
                ? remaining / requestsPerSecond
                : 0;

        const percent =
            (
                completedRequests /
                totalRequests *
                100
            ).toFixed(2);

        console.log(
            `Progress: ${percent}% | ` +
            `Requests: ${completedRequests}/${totalRequests} | ` +
            `Rate: ${requestsPerSecond.toFixed(2)} req/s | ` +
            `ETA: ${Math.round(etaSeconds / 60)} min`
        );
    }

    console.log();
    console.log(
        "========================================"
    );
    console.log(
        " NO DOCTOR REGISTRATION EVENT FOUND"
    );
    console.log(
        "========================================"
    );
}

main().catch(error => {
    console.error();
    console.error("SEARCH FAILED");
    console.error(error);
    process.exit(1);
});
