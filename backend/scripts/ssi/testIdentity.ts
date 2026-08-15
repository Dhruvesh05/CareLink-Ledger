import identityService from "../../src/ssi/services/IdentityService";

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Identity Service Test");
    console.log("=================================");

    console.log("\n1. Creating identity...");

    const created = await identityService.createIdentity("test-doctor");

    console.log("Created identity:");
    console.log(created);

    if (!created.did) {
        throw new Error("Identity does not contain a DID.");
    }

    if (!created.did.startsWith("did:key:")) {
        throw new Error(`Expected did:key DID, received: ${created.did}`);
    }

    if (created.alias !== "test-doctor") {
        throw new Error(
            `Expected alias "test-doctor", received: ${created.alias}`
        );
    }

    console.log("✓ Identity created successfully");
    console.log("✓ Valid did:key DID");
    console.log("✓ Alias preserved");

    console.log("\n2. Retrieving identity by DID...");

    const retrieved = await identityService.getIdentityByDid(created.did);

    console.log("Retrieved identity:");
    console.log(retrieved);

    if (!retrieved) {
        throw new Error("Identity could not be retrieved.");
    }

    if (retrieved.did !== created.did) {
        throw new Error("Retrieved DID does not match created DID.");
    }

    if (retrieved.alias !== "test-doctor") {
        throw new Error(
            `Retrieved alias does not match. Received: ${retrieved.alias}`
        );
    }

    console.log("✓ Identity retrieved successfully");
    console.log("✓ DID matches");
    console.log("✓ Alias matches");

    console.log("\n3. Listing identities...");

    const identities = await identityService.getIdentities();

    console.log(`Total identities: ${identities.length}`);

    const found = identities.some(
        (identity) =>
            identity.did === created.did &&
            identity.alias === "test-doctor"
    );

    if (!found) {
        throw new Error(
            "Created identity was not found in the identity list."
        );
    }

    console.log("✓ Identity appears in identity list");

    console.log("\n=================================");
    console.log("IDENTITY SERVICE TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("IDENTITY SERVICE TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
