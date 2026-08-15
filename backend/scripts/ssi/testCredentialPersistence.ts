import { createAgent } from "../../src/ssi/agent/createAgent";
import IdentityService from "../../src/ssi/services/IdentityService";
import CredentialPersistenceService from "../../src/ssi/services/CredentialPersistenceService";
import VerificationService from "../../src/ssi/services/VerificationService";

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Credential Persistence Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");
    const agent = await createAgent();
    console.log("✓ Veramo agent created");

    console.log("\n2. Creating issuer did:key...");
    const issuer = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    const issuerDid = issuer.did;
    console.log("Issuer DID:", issuerDid);

    console.log("\n3. Creating CareLink identity...");
    const identity = await IdentityService.createIdentity(
        `credential-persistence-doctor-${Date.now()}`,
    );
    console.log("Identity DID:", identity.did);
    console.log("Identity alias:", identity.alias ?? "none");

    console.log("\n4. Issuing credential...");
    const issuedCredential = await IdentityService.issueCredentialForIdentity(identity.did, issuerDid, {
        role: "doctor",
    });
    console.log("Credential returned:", Boolean(issuedCredential));

    console.log("\n5. Saving credential...");
    const storedId = await CredentialPersistenceService.saveCredential(issuedCredential);
    console.log("Stored credential ID:", storedId);

    console.log("\n6. Retrieving credential...");
    const retrieved = await CredentialPersistenceService.getCredential(storedId);
    console.log("Retrieved credential:", Boolean(retrieved));
    console.log("Retrieved issuer:", retrieved?.issuer);
    console.log("Retrieved credentialSubject:", retrieved?.credentialSubject);
    console.log("Retrieved proof:", retrieved?.proof);

    if (!retrieved) {
        throw new Error("Credential retrieval failed.");
    }

    if (!retrieved.issuer) {
        throw new Error("Retrieved credential is missing issuer.");
    }

    if (!retrieved.credentialSubject) {
        throw new Error("Retrieved credential is missing credentialSubject.");
    }

    if (retrieved.credentialSubject.id !== identity.did) {
        throw new Error(
            `Retrieved credential subject DID mismatch. Expected ${identity.did}, got ${retrieved.credentialSubject.id}`,
        );
    }

    if (!retrieved.proof) {
        throw new Error("Retrieved credential is missing proof.");
    }

    console.log("\n7. Verifying retrieved credential...");
    const verification = await VerificationService.verifyCredential(retrieved);
    console.log("Verification succeeded:", verification.verified);
    console.log("Verification error:", verification.error ?? "none");

    if (!verification.verified) {
        throw new Error(`Retrieved credential verification failed: ${verification.error?.message ?? "unknown error"}`);
    }

    console.log("\n8. Testing nonexistent credential...");
    const missing = await CredentialPersistenceService.getCredential("missing-credential-id");
    console.log("Missing credential result:", missing ?? "null");

    if (missing !== null) {
        throw new Error("Expected a null return for a missing credential.");
    }

    console.log("\n=================================");
    console.log("CREDENTIAL PERSISTENCE TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("CREDENTIAL PERSISTENCE TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
