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
    // 1. Create issuer DID
    // ------------------------------------------------------------

    const issuer = await agent.didManagerCreate({
        provider: "did:key",
        alias: `carelink-issuer-${Date.now()}`,
    });

    if (!issuer?.did) {
        throw new Error("Issuer DID creation failed.");
    }

    // ------------------------------------------------------------
    // 2. Create subject DID
    // ------------------------------------------------------------

    const subject = await agent.didManagerCreate({
        provider: "did:key",
        alias: `carelink-subject-${Date.now()}`,
    });

    if (!subject?.did) {
        throw new Error("Subject DID creation failed.");
    }

    // ------------------------------------------------------------
    // 3. Issue real Verifiable Credential
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

    if (!credential) {
        throw new Error("Verifiable Credential issuance failed.");
    }

    if (!credential.proof) {
        throw new Error("Issued credential does not contain a proof.");
    }

    // ------------------------------------------------------------
    // 4. Verify the real credential
    // ------------------------------------------------------------

    const verification = await agent.verifyCredential({
        credential,
    });

    if (!verification?.verified) {
        throw new Error(
            `Credential verification failed: ${
                verification?.error?.message ?? "unknown error"
            }`,
        );
    }

    // ------------------------------------------------------------
    // 5. Persist the credential
    // ------------------------------------------------------------

    const credentialId =
        await agent.dataStoreSaveVerifiableCredential({
            verifiableCredential: credential,
        });

    if (!credentialId) {
        throw new Error("Credential persistence failed.");
    }

    // ------------------------------------------------------------
    // 6. Retrieve the credential
    // ------------------------------------------------------------

    const retrieved =
        await agent.dataStoreGetVerifiableCredential({
            hash: credentialId,
        });

    if (!retrieved) {
        throw new Error("Persisted credential could not be retrieved.");
    }

    // ------------------------------------------------------------
    // 7. Verify the retrieved credential
    // ------------------------------------------------------------

    const retrievedVerification =
        await agent.verifyCredential({
            credential: retrieved,
        });

    if (!retrievedVerification?.verified) {
        throw new Error(
            `Retrieved credential verification failed: ${
                retrievedVerification?.error?.message ?? "unknown error"
            }`,
        );
    }

    // ------------------------------------------------------------
    // Success
    // ------------------------------------------------------------

    console.log("SSI credential lifecycle integration test PASSED");
    console.log(`Issuer DID: ${issuer.did}`);
    console.log(`Subject DID: ${subject.did}`);
    console.log(`Credential ID: ${credentialId}`);
    console.log(
        `Credential proof type: ${credential.proof?.type ?? "unknown"}`,
    );
    console.log("Initial verification: PASSED");
    console.log("Persistence: PASSED");
    console.log("Retrieval: PASSED");
    console.log("Retrieved credential verification: PASSED");
}

main().catch((error: unknown) => {
    console.error("SSI credential lifecycle integration test FAILED");

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
