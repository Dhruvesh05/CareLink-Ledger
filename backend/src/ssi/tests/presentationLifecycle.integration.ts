import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main(): Promise<void> {
    const temporaryDirectory = await mkdtemp(
        path.join(os.tmpdir(), "carelink-vp-")
    );

    process.env.SSI_SECRET_KEY =
        "11".repeat(32);
    process.env.SSI_DATABASE =
        path.join(temporaryDirectory, "ssi.sqlite");

    try {
<<<<<<< Updated upstream
        const [{ createAgent }, { default: CredentialService }, presentationModule] =
            await Promise.all([
                import("../agent/createAgent.js"),
                import("../services/CredentialService.js"),
                import("../services/PresentationService.js"),
            ]);

        const {
            default: PresentationService,
        } = presentationModule;

        const agent = await createAgent();

=======
        const agentModule = await import("../agent/createAgent.js");
        const credentialModule = await import("../services/CredentialService.js");
        const presentationModule = await import("../services/PresentationService.js");

        const createAgent = agentModule.createAgent;
        const CredentialService = new credentialModule.CredentialService();
        const PresentationService = new presentationModule.PresentationService();

        const agent = await createAgent();
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        const credential = await CredentialService.default.issueCredential(
=======
        const credential = await CredentialService.issueCredential(
>>>>>>> Stashed changes
            issuer.did,
            holder.did,
            { role: "Doctor" },
            ["VerifiableCredential", "CareLinkRoleCredential"]
        );

        if (!credential?.proof) {
            throw new Error("CareLink credential proof was not generated.");
        }

        const challengeA = `carelink-vp-challenge-a-${Date.now()}`;
        const challengeB = `carelink-vp-challenge-b-${Date.now()}`;

<<<<<<< Updated upstream
        const presentation = await PresentationService.default.createPresentation(
=======
        const presentation = await PresentationService.createPresentation(
>>>>>>> Stashed changes
            holder.did,
            [credential],
            challengeA
        );

        const matchingVerification =
<<<<<<< Updated upstream
            await PresentationService.default.verifyPresentation(
=======
            await PresentationService.verifyPresentation(
>>>>>>> Stashed changes
                presentation,
                challengeA
            );

        if (!matchingVerification.verified) {
            throw new Error(
                `VP verification with the matching challenge failed: ${
                    matchingVerification.error?.message || "unknown error"
                }`
            );
        }

        const mismatchedVerification =
<<<<<<< Updated upstream
            await PresentationService.default.verifyPresentation(
=======
            await PresentationService.verifyPresentation(
>>>>>>> Stashed changes
                presentation,
                challengeB
            );

        if (mismatchedVerification.verified) {
            throw new Error(
                "The same VP was accepted with a different challenge."
            );
        }

        console.log("SSI presentation lifecycle integration test PASSED");
    } finally {
        await rm(temporaryDirectory, {
            recursive: true,
            force: true,
        });
    }
}

main().catch((error: unknown) => {
    console.error("SSI presentation lifecycle integration test FAILED");
    console.error(error);
    process.exit(1);
<<<<<<< Updated upstream
});
=======
});
>>>>>>> Stashed changes
