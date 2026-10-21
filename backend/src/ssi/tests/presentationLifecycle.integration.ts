
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main(): Promise<void> {
    const temporaryDirectory = await mkdtemp(
        path.join(os.tmpdir(), "carelink-vp-")
    );

    process.env.SSI_SECRET_KEY = "11".repeat(32);
    process.env.SSI_DATABASE = path.join(
        temporaryDirectory,
        "ssi.sqlite"
    );

    try {
        const { createAgent } = await import(
            "../agent/createAgent.js"
        );
        const { CredentialService: CredentialServiceClass } = await import(
            "../services/CredentialService.js"
        );

        const credentialService = new CredentialServiceClass();

        const { PresentationService: PresentationServiceClass } = await import(
            "../services/PresentationService.js"
        );

        const presentationService = new PresentationServiceClass();

        const agent = await createAgent();

        const issuer = await agent.didManagerCreate({
            provider: "did:key",
            alias: `carelink-vp-issuer-${Date.now()}`,
        });

        const holder = await agent.didManagerCreate({
            provider: "did:key",
            alias: `carelink-vp-holder-${Date.now()}`,
        });

        if (!issuer?.did || !holder?.did) {
            throw new Error("Issuer or holder DID creation failed.");
        }

        const credential = await credentialService.issueCredential(
            issuer.did,
            holder.did,
            { role: "Doctor" },
            ["VerifiableCredential", "CareLinkRoleCredential"]
        );

        if (
            !credential ||
            typeof credential === "string" ||
            !credential.proof
        ) {
            throw new Error(
                "CareLink credential proof was not generated."
            );
        }

        const challengeA = `carelink-vp-challenge-a-${Date.now()}`;
        const challengeB = `carelink-vp-challenge-b-${Date.now()}`;

        const presentation =
            await presentationService.createPresentation(
                holder.did,
                [credential],
                challengeA
            );

        const matchingVerification =
            await presentationService.verifyPresentation(
                presentation,
                challengeA
            );

        if (!matchingVerification.verified) {
            throw new Error(
                `VP verification with the matching challenge failed: ${
                    matchingVerification.error?.message ||
                    "unknown error"
                }`
            );
        }

        const mismatchedVerification =
            await presentationService.verifyPresentation(
                presentation,
                challengeB
            );

        if (mismatchedVerification.verified) {
            throw new Error(
                "The same VP was accepted with a different challenge."
            );
        }

        console.log(
            "SSI presentation lifecycle integration test PASSED"
        );
    } finally {
        await rm(temporaryDirectory, {
            recursive: true,
            force: true,
        });
    }
}

main().catch((error: unknown) => {
    console.error(
        "SSI presentation lifecycle integration test FAILED"
    );
    console.error(error);
    process.exit(1);
});
