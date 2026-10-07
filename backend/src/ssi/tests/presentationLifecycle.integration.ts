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
        const [{ createAgent }, { default: CredentialService }, presentationModule] =
            await Promise.all([
                import("../agent/createAgent"),
                import("../services/CredentialService"),
                import("../services/PresentationService"),
            ]);

        const {
            default: PresentationService,
        } = presentationModule;

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

        const credential = await CredentialService.issueCredential(
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

        const presentation = await PresentationService.createPresentation(
            holder.did,
            [credential],
            challengeA
        );

        const matchingVerification =
            await PresentationService.verifyPresentation(
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
            await PresentationService.verifyPresentation(
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
});