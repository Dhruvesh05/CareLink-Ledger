import { createAgent } from "../agent/createAgent";

async function main(): Promise<void> {
    process.env.SSI_SECRET_KEY =
        process.env.SSI_SECRET_KEY ||
        "carelink-test-secret-key-32-characters";

    const agent = await createAgent();

    if (!agent) {
        throw new Error("Veramo agent was not created.");
    }

    // ------------------------------------------------------------
    // 1. Create issuer and subject DIDs
    // ------------------------------------------------------------

    const issuer = await agent.didManagerCreate({
        provider: "did:key",
        alias: `carelink-security-issuer-${Date.now()}`,
    });

    const subject = await agent.didManagerCreate({
        provider: "did:key",
        alias: `carelink-security-subject-${Date.now()}`,
    });

    if (!issuer?.did || !subject?.did) {
        throw new Error("DID creation failed.");
    }

    // ------------------------------------------------------------
    // 2. Issue a real credential
    // ------------------------------------------------------------

    const credential = await agent.createVerifiableCredential({
        credential: {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
            ],
            type: [
                "VerifiableCredential",
                "IdentityCredential",
            ],
            issuer: issuer.did,
            credentialSubject: {
                id: subject.did,
                role: "doctor",
                organization: "CareLink Ledger",
            },
        },
        proofFormat: "jwt",
    });

    if (!credential?.proof) {
        throw new Error("Credential proof was not generated.");
    }

    // ------------------------------------------------------------
    // 3. Baseline verification
    // ------------------------------------------------------------

    const validResult = await agent.verifyCredential({
        credential,
    });

    if (!validResult?.verified) {
        throw new Error(
            `Baseline credential verification failed: ${
                validResult?.error?.message ?? "unknown error"
            }`,
        );
    }

    console.log("Baseline verification: PASSED");

    // ------------------------------------------------------------
    // 4. Tamper with credentialSubject
    // ------------------------------------------------------------

    const tamperedCredential = {
        ...credential,
        credentialSubject: {
            ...credential.credentialSubject,
            role: "admin",
        },
    };

    const tamperedResult = await agent.verifyCredential({
        credential: tamperedCredential,
    });

    if (tamperedResult?.verified) {
        throw new Error(
            "Tampered credential was incorrectly accepted.",
        );
    }

    console.log("Tampered credential rejection: PASSED");

    // ------------------------------------------------------------
    // 5. Tamper with JWT proof
    // ------------------------------------------------------------

    const tamperedProofCredential = {
        ...credential,
        proof: {
            ...(credential.proof as Record<string, unknown>),
            jwt:
                typeof (credential.proof as any).jwt === "string"
                    ? `${(credential.proof as any).jwt}tampered`
                    : "tampered",
        },
    };

    const invalidSignatureResult =
        await agent.verifyCredential({
            credential: tamperedProofCredential,
        });

    if (invalidSignatureResult?.verified) {
        throw new Error(
            "Credential with tampered JWT proof was incorrectly accepted.",
        );
    }

    console.log("Invalid signature rejection: PASSED");

    // ------------------------------------------------------------
    // Success
    // ------------------------------------------------------------

    console.log(
        "SSI credential security integration test PASSED",
    );
}

main().catch((error: unknown) => {
    console.error(
        "SSI credential security integration test FAILED",
    );

    if (error instanceof Error) {
        console.error(error.message);

        if (error.stack) {
            console.error(error.stack);
        }
    } else {
        console.error(error);
    }

    process.exit(1);
});
