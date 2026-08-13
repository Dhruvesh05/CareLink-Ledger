import { createAgent } from "../../src/ssi/agent/createAgent";

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Real DID Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");

    const agent = await createAgent();
    console.log("\nAvailable Veramo methods:");
    console.log(agent.availableMethods);

    console.log("✓ Veramo agent created");

    console.log("\n2. Creating did:key DID...");

    const identifier = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });

    console.log("✓ DID created");
    console.log("DID:", identifier.did);

    if (!identifier.did.startsWith("did:key:")) {
        throw new Error(`Unexpected DID method: ${identifier.did}`);
    }

    console.log("\n3. Resolving DID...");

    const resolution = await agent.execute("resolveDid", {
        didUrl: identifier.did,
    });

    console.log("✓ DID resolved");

    console.log("\n4. DID Document:");

    console.dir(resolution.didDocument, {
        depth: null,
    });

    if (!resolution.didDocument) {
        throw new Error("DID resolution returned no DID Document");
    }

    if (resolution.didDocument.id !== identifier.did) {
        throw new Error(
            `DID Document ID does not match created DID.\n` +
            `Created: ${identifier.did}\n` +
            `Resolved: ${resolution.didDocument.id}`
        );
    }

    console.log("\n=================================");
    console.log("SSI DID TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("SSI DID TEST FAILED");
    console.error("=================================");
    console.error(error);

    process.exit(1);
});
