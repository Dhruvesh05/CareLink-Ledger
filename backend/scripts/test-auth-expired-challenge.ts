import "dotenv/config";
import { ethers } from "ethers";
import mongoose from "mongoose";

import AuthNonceModel from "../src/models/AuthNonce";

async function main() {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY is not configured");
    }

    const wallet = new ethers.Wallet(privateKey);

    console.log("Wallet:", wallet.address);

    const challengeResponse = await fetch(
        "http://localhost:5000/api/auth/challenge",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                walletAddress: wallet.address
            })
        }
    );

    const challenge = await challengeResponse.json();

    if (!challenge.success) {
        throw new Error(
            `Challenge failed: ${challenge.message}`
        );
    }

    const message = challenge.data.message;

    console.log("Challenge received successfully");

    const signature =
        await wallet.signMessage(message);

    console.log("Signature created");

    const nonceLine =
        message
            .split("\n")
            .find((line: string) =>
                line.startsWith("Nonce: ")
            );

    if (!nonceLine) {
        throw new Error(
            "Nonce not found in challenge message"
        );
    }

    const nonce =
        nonceLine.replace("Nonce: ", "").trim();

    console.log("Challenge nonce identified");

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGODB_URI is not configured"
        );
    }

    await mongoose.connect(mongoUri);

    const updateResult =
        await AuthNonceModel.updateOne(
            {
                walletAddress:
                    wallet.address.toLowerCase(),
                nonce,
                used: false
            },
            {
                $set: {
                    expiresAt: new Date(
                        Date.now() - 60 * 1000
                    )
                }
            }
        );

    if (updateResult.modifiedCount !== 1) {
        await mongoose.disconnect();

        throw new Error(
            `Failed to expire exact challenge. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`
        );
    }

    await mongoose.disconnect();

    console.log(
        "Exact challenge manually expired"
    );

    const response = await fetch(
        "http://localhost:5000/api/auth/verify",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                walletAddress: wallet.address,
                message,
                signature
            })
        }
    );

    const result = await response.json();

    console.log(
        "Verification status:",
        response.status
    );

    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );

    if (
        response.status === 200 ||
        result.success
    ) {
        throw new Error(
            "SECURITY FAILURE: expired challenge was accepted"
        );
    }

    if (
        result.message !==
        "Authentication challenge has expired"
    ) {
        throw new Error(
            `Unexpected rejection message: ${result.message}`
        );
    }

    console.log(
        "Expired-challenge protection test passed."
    );
}

main().catch((error) => {
    console.error(
        error instanceof Error
            ? error.message
            : error
    );

    process.exit(1);
});
