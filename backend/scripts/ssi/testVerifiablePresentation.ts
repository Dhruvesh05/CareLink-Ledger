import { createAgent } from "../../src/ssi/agent/createAgent";
import IdentityService from "../../src/ssi/services/IdentityService";
import PresentationService from "../../src/ssi/services/PresentationService";

function requireDid(value: unknown, label: string): string {
    const did = typeof value === "string" ? value : (value as any)?.did;

    if (!did || typeof did !== "string") {
        throw new Error(`${label} DID was not returned.`);
    }

    return did;
}

function printPresentationDetails(label: string, presentation: any): void {
    console.log(`${label} holder:`, presentation?.holder ?? "not present");
    console.log(`${label} type:`, presentation?.type ?? "not present");
    console.log(
        `${label} credential count:`,
        Array.isArray(presentation?.verifiableCredential)
            ? presentation.verifiableCredential.length
            : "not present",
    );
    console.log(`${label} proof exists:`, Boolean(presentation?.proof));
    console.log(`${label} proof type:`, presentation?.proof?.type ?? "not present");
}

function tamperSignedPresentation(presentation: any): any {
    const jwt = presentation?.proof?.jwt;

    if (typeof jwt !== "string") {
        throw new Error("Generated presentation did not contain a JWT proof.");
    }

    const segments = jwt.split(".");
    if (segments.length !== 3) {
        throw new Error("Generated presentation JWT did not have three segments.");
    }

    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
    if (!payload?.vp || typeof payload.vp !== "object") {
        throw new Error("Generated presentation JWT did not contain a VP payload.");
    }

    payload.vp.holder = "did:key:tampered-holder";

    const tamperedJwt = [
        segments[0],
        Buffer.from(JSON.stringify(payload)).toString("base64url"),
        segments[2],
    ].join(".");

    const tamperedPresentation = JSON.parse(JSON.stringify(presentation));
    tamperedPresentation.proof.jwt = tamperedJwt;
    return tamperedPresentation;
}

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Verifiable Presentation Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");
    const agent = await createAgent();
    console.log("✓ Veramo agent created");

    console.log("\n2. Creating issuer did:key DID...");
    const issuerResult = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    const issuerDid = requireDid(issuerResult, "Issuer");
    console.log("Issuer DID:", issuerDid);

    console.log("\n3. Creating CareLink identity...");
    const holderAlias = `vp-smoke-test-holder-${Date.now()}`;
    const identity = await IdentityService.createIdentity(holderAlias);
    console.log("Holder DID:", identity.did);

    if (!identity.did.startsWith("did:key:")) {
        throw new Error(`Unexpected identity DID format: ${identity.did}`);
    }

    console.log("\n4. Issuing a real W3C Verifiable Credential...");
    const credential = await IdentityService.issueCredentialForIdentity(
        identity.did,
        issuerDid,
        { role: "doctor", testCase: "verifiable-presentation-smoke-test" },
    );

    if (!credential) {
        throw new Error("No credential was returned from the issuance flow.");
    }

    if (credential.credentialSubject?.id !== identity.did) {
        throw new Error(
            `Credential subject DID mismatch. Expected ${identity.did}, got ${credential.credentialSubject?.id}`,
        );
    }

    if (!credential.proof) {
        throw new Error("Issued credential did not contain a proof.");
    }

    console.log("Credential subject DID:", credential.credentialSubject.id);
    console.log("Credential proof exists:", Boolean(credential.proof));
    console.log("Credential proof type:", credential.proof.type ?? "not present");

    console.log("\n5. Creating a Verifiable Presentation...");
    const presentation = await PresentationService.createPresentation(
        identity.did,
        [credential],
    );

    if (!presentation) {
        throw new Error("No presentation was returned.");
    }

    if (presentation.holder !== identity.did) {
        throw new Error(
            `Presentation holder DID mismatch. Expected ${identity.did}, got ${presentation.holder}`,
        );
    }

    if (!presentation.proof) {
        throw new Error("Generated presentation did not contain a proof.");
    }

    printPresentationDetails("Generated presentation", presentation);

    console.log("\n6. Verifying the generated Verifiable Presentation...");
    const verification = await PresentationService.verifyPresentation(presentation);
    console.log("Verification succeeded:", verification.verified);
    console.log("Verification error:", verification.error ?? "none");

    if (!verification.verified) {
        throw new Error(
            `Generated presentation verification failed: ${verification.error?.message ?? "unknown error"}`,
        );
    }

    console.log("\n7. Tampering with a presentation claim without re-signing...");
    const tamperedPresentation = tamperSignedPresentation(presentation);

    const tamperedVerification = await PresentationService.verifyPresentation(
        tamperedPresentation,
    );
    console.log("Tampered presentation rejected:", tamperedVerification.verified === false);
    console.log("Tampered verification error:", tamperedVerification.error ?? "none");

    if (tamperedVerification.verified !== false) {
        throw new Error("Tampered presentation was incorrectly verified.");
    }

    const challenge = "carelink-vp-smoke-test-challenge";
    const domain = "carelink-ledger.example";

    console.log("\n8. Creating a Verifiable Presentation with challenge and domain...");
    const protectedPresentation = await PresentationService.createPresentation(
        identity.did,
        [credential],
        challenge,
        domain,
    );

    printPresentationDetails("Challenge/domain presentation", protectedPresentation);

    console.log("\n9. Verifying with the same challenge and domain...");
    const protectedVerification = await PresentationService.verifyPresentation(
        protectedPresentation,
        challenge,
        domain,
    );
    console.log("Verification succeeded:", protectedVerification.verified);
    console.log("Verification error:", protectedVerification.error ?? "none");

    if (!protectedVerification.verified) {
        throw new Error(
            `Challenge/domain presentation verification failed: ${protectedVerification.error?.message ?? "unknown error"}`,
        );
    }

    console.log("\n10. Verifying with an incorrect challenge...");
    const incorrectChallengeVerification = await PresentationService.verifyPresentation(
        protectedPresentation,
        "incorrect-challenge",
        domain,
    );
    console.log(
        "Incorrect challenge rejected:",
        incorrectChallengeVerification.verified === false,
    );
    console.log(
        "Incorrect challenge verification error:",
        incorrectChallengeVerification.error ?? "none",
    );

    if (incorrectChallengeVerification.verified !== false) {
        throw new Error("Presentation with an incorrect challenge was incorrectly verified.");
    }

    console.log("\n=================================");
    console.log("SSI VERIFIABLE PRESENTATION TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("SSI VERIFIABLE PRESENTATION TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});
