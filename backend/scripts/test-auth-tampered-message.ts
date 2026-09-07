import "dotenv/config";
import { ethers } from "ethers";

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

    const originalMessage =
        challenge.data.message;

    console.log("Challenge received successfully");

    const signature =
        await wallet.signMessage(originalMessage);

    console.log("Signature created");

    const tamperedMessage =
        originalMessage +
        "\nTampered: true";

    console.log("Sending tampered message...");

    const response = await fetch(
        "http://localhost:5000/api/auth/verify",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                walletAddress: wallet.address,
                message: tamperedMessage,
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
            "SECURITY FAILURE: tampered message was accepted"
        );
    }

    if (
        result.message !==
        "Authentication message does not match the challenge"
    ) {
        throw new Error(
            `Unexpected rejection message: ${result.message}`
        );
    }

    console.log(
        "Tampered-message protection test passed."
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
