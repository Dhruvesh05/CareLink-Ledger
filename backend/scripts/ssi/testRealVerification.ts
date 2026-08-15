import { createAgent } from "../../src/ssi/agent/createAgent";
import VerificationService from "../../src/ssi/services/VerificationService";

function getDidValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object") {
        const maybeDid = (value as any)?.did ?? (value as any)?.id ?? "unknown";
        return typeof maybeDid === "string" ? maybeDid : "unknown";
    }

    return "unknown";
}

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Real Verification Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");
    const agent = await createAgent();
    console.log("✓ Veramo agent created");

    console.log("\n2. Creating issuer did:key...");
    const issuerResult = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    const issuerDid = getDidValue(issuerResult?.did ?? issuerResult);
    console.log("Issuer DID:", issuerDid);

    console.log("\n3. Creating subject did:key...");
    const subjectResult = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    const subjectDid = getDidValue(subjectResult?.did ?? subjectResult);
    console.log("Subject DID:", subjectDid);

    const credentialPayload = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "IdentityCredential"],
        issuer: issuerDid,
        credentialSubject: {
            id: subjectDid,
            role: "doctor",
        },
    };

    console.log("\n4. Issuing a real W3C credential...");
    const issuedCredential = await agent.execute("createVerifiableCredential", {
        credential: credentialPayload,
        proofFormat: "jwt",
    });

    if (!issuedCredential) {
        throw new Error("No credential was returned from Veramo.");
    }

    console.log("\n5. Verifying the original credential...");
    const verification = await VerificationService.verifyCredential(issuedCredential as any);
    console.log("Issuer DID:", issuerDid);
    console.log("Subject DID:", subjectDid);
    console.log("Verification succeeded:", verification.verified);
    console.log("Verification error:", verification.error ?? "none");

    if (!verification.verified) {
        throw new Error(`Original credential verification failed: ${verification.error?.message ?? "unknown error"}`);
    }

    console.log("\n6. Tampering with the credential without re-signing...");
    const tamperedCredential = JSON.parse(JSON.stringify(issuedCredential));
    if (tamperedCredential?.credentialSubject) {
        tamperedCredential.credentialSubject.role = "patient";
    }

    const tamperedResult = await VerificationService.verifyCredential(tamperedCredential as any);
    console.log("Tampered credential rejected:", tamperedResult.verified === false || Boolean(tamperedResult.error));
    if (tamperedResult.error) {
        console.log("Tampered verification error:", tamperedResult.error);
    }

    console.log("\n=================================");
    console.log("REAL VERIFICATION SMOKE TEST READY");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("REAL VERIFICATION SMOKE TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
