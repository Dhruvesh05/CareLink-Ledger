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

    const message = challenge.data.message;

    console.log("Challenge received successfully");

    const signature =
        await wallet.signMessage(message);

    console.log("Signature created");

    const firstVerifyResponse =
        await fetch(
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

    const firstResult =
        await firstVerifyResponse.json();

    console.log(
        "First verification:",
        firstVerifyResponse.status
    );

    console.log(
        JSON.stringify(
            {
                success: firstResult.success,
                message: firstResult.message,
                role:
                    firstResult.data?.user?.role
            },
            null,
            2
        )
    );

    const replayResponse =
        await fetch(
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

    const replayResult =
        await replayResponse.json();

    console.log(
        "Replay verification:",
        replayResponse.status
    );

    console.log(
        JSON.stringify(
            replayResult,
            null,
            2
        )
    );

    if (
        firstVerifyResponse.status !== 200 ||
        !firstResult.success
    ) {
        throw new Error(
            "First authentication attempt failed"
        );
    }

    if (
        replayResponse.status === 200 ||
        replayResult.success
    ) {
        throw new Error(
            "SECURITY FAILURE: replay was accepted"
        );
    }

    console.log(
        "Replay protection test passed."
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
