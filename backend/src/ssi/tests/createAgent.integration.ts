import { createAgent } from "../agent/createAgent";

async function main(): Promise<void> {
    process.env.SSI_SECRET_KEY =
        process.env.SSI_SECRET_KEY ||
        "carelink-test-secret-key-32-characters";

    const agent = await createAgent();

    if (!agent) {
        throw new Error("Veramo agent was not created.");
    }

    const alias =
        `carelink-integration-test-${Date.now()}`;

    const created = await agent.didManagerCreate({
        provider: "did:key",
        alias,
    });

    if (!created?.did) {
        throw new Error("DID creation failed.");
    }

    if (!created.did.startsWith("did:key:")) {
        throw new Error(
            `Unexpected DID method: ${created.did}`
        );
    }

    const resolved = await agent.resolveDid({
        didUrl: created.did,
    });

    if (!resolved?.didDocument) {
        throw new Error("DID resolution failed.");
    }

    if (resolved.didDocument.id !== created.did) {
        throw new Error(
            "Resolved DID does not match created DID."
        );
    }

    console.log("SSI Veramo integration test PASSED");
    console.log(`Alias: ${alias}`);
    console.log(`Created DID: ${created.did}`);
}

main().catch((error: unknown) => {
    console.error("SSI Veramo integration test FAILED");
    console.error(error);
    process.exit(1);
});
