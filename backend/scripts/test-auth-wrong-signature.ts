import "dotenv/config";
import { ethers } from "ethers";

async function main() {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("PRIVATE_KEY is not configured");
    }

    const walletA = new ethers.Wallet(privateKey);

    const walletB = ethers.Wallet.createRandom();

    console.log("Challenge wallet:", walletA.address);
    console.log("Different signing wallet:", walletB.address);

    const challengeResponse = await fetch(
        "http://localhost:5000/api/auth/challenge",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                walletAddress: walletA.address
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

    const wrongSignature =
        await walletB.signMessage(message);

    console.log("Wrong-wallet signature created");

    const response = await fetch(
        "http://localhost:5000/api/auth/verify",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                walletAddress: walletA.address,
                message,
                signature: wrongSignature
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
            "SECURITY FAILURE: wrong signature was accepted"
        );
    }

    console.log(
        "Wrong-signature protection test passed."
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
