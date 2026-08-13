import { createAgent } from "../../src/ssi/agent/createAgent";

async function main() {
    console.log("=================================");
    console.log("CareLink SSI Real Credential Test");
    console.log("=================================");

    console.log("\n1. Creating Veramo agent...");
    const agent = await createAgent();
    console.log("✓ Veramo agent created");

    console.log("\n2. Creating issuer did:key...");
    const issuer = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    console.log("Issuer DID:", issuer.did);

    console.log("\n3. Creating subject did:key...");
    const subject = await agent.execute("didManagerCreate", {
        provider: "did:key",
    });
    console.log("Subject DID:", subject.did);

    const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "IdentityCredential"],
        issuer: issuer.did,
        credentialSubject: {
            id: subject.did,
            role: "doctor",
        },
    };

    console.log("\n4. Issuing verification credential...");
    const issued = await agent.execute("createVerifiableCredential", {
        credential,
        proofFormat: "jwt",
    });

    console.log("\nREAL VC ISSUANCE SUCCESS");
    console.log("Credential returned:", Boolean(issued));

    // Diagnostic output
    console.log("\nActual credential issuer:");
    console.dir(issued?.issuer, { depth: null });

    console.log("\nActual credential subject:");
    console.dir(issued?.credentialSubject, { depth: null });

    console.log("\nProof:");
    console.dir(issued?.proof, { depth: null });

    console.log("\nExpected issuer DID:");
    console.log(issuer.did);

    console.log("\nExpected subject DID:");
    console.log(subject.did);

    console.log("\nValidation:");
    console.log(
        "Issuer matches:",
        issued?.issuer?.id === issuer.did
    );
    console.log(
        "Subject matches:",
        issued?.credentialSubject?.id === subject.did
    );
    console.log("Proof exists:", Boolean(issued?.proof));

    if (!issued) {
        throw new Error("No credential was returned from Veramo.");
    }

    if (issued.issuer?.id !== issuer.did) {
        throw new Error(
            `Issued credential issuer did not match the created issuer DID. Expected ${issuer.did}.`
        );
    }

    if (issued.credentialSubject?.id !== subject.did) {
        throw new Error(
            `Issued credential subject did not match the created subject DID. Expected ${subject.did}.`
        );
    }

    if (!issued.proof) {
        throw new Error("Issued credential did not contain a proof.");
    }

    console.log("\n=================================");
    console.log("REAL VC ISSUANCE TEST PASSED");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n=================================");
    console.error("REAL VC ISSUANCE TEST FAILED");
    console.error("=================================");
    console.error(error);
    process.exit(1);
});