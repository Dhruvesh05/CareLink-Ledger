import { createAgent } from "../../src/ssi/agent/createAgent";
import IdentityService from "../../src/ssi/services/IdentityService";
import VerificationService from "../../src/ssi/services/VerificationService";

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Identity Credential Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");
    const agent = await createAgent();
    console.log("✓ Veramo agent created");

    console.log("\n2. Creating issuer did:key...");
    const issuerResult = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    const issuerDid = issuerResult?.did;
    console.log("Issuer DID:", issuerDid);

    console.log("\n3. Creating CareLink identity...");
    const identity = await IdentityService.createIdentity("credential-test-doctor");
    console.log("Identity DID:", identity.did);
    console.log("Identity alias:", identity.alias ?? "none");

    if (!identity.did.startsWith("did:key:")) {
        throw new Error(`Unexpected identity DID format: ${identity.did}`);
    }

    console.log("\n4. Issuing VC for the identity...");
    const issuedCredential = await IdentityService.issueCredentialForIdentity(identity.did, issuerDid, {
        role: "doctor",
    });

    if (!issuedCredential) {
        throw new Error("No credential was returned from the issuance flow.");
    }

    console.log("Credential issuer:", issuedCredential.issuer);
    console.log("Credential subject:", issuedCredential.credentialSubject);
    console.log("Proof:", issuedCredential.proof);

    if (issuedCredential.credentialSubject?.id !== identity.did) {
        throw new Error(
            `Credential subject DID mismatch. Expected ${identity.did}, got ${issuedCredential.credentialSubject?.id}`,
        );
    }

    if (!issuedCredential.proof) {
        throw new Error("Issued credential did not contain a proof.");
    }

    console.log("\n5. Verifying the issued credential...");
    const verification = await VerificationService.verifyCredential(issuedCredential);
    console.log("Verification succeeded:", verification.verified);
    console.log("Verification error:", verification.error ?? "none");

    if (!verification.verified) {
        throw new Error(`Issued credential verification failed: ${verification.error?.message ?? "unknown error"}`);
    }

    console.log("\n6. Testing missing identity rejection...");

    const missingDid =
        "did:key:z6MkfQnV1aK8mN2K1gYk9tL7M3Q4pVxXvM9b5m3dH4D5gC8n";

    let rejected = false;

    try {
        await IdentityService.issueCredentialForIdentity(
            missingDid,
            issuerDid,
            { role: "doctor" },
        );
    } catch (error: any) {
        rejected = true;
        console.log("Rejected as expected:", error.message);
    }

    if (!rejected) {
        throw new Error(
            "IdentityService incorrectly issued a credential for a non-existent identity.",
        );
    }

    console.log("\n=================================");
    console.log("SSI IDENTITY CREDENTIAL TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("SSI IDENTITY CREDENTIAL TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
