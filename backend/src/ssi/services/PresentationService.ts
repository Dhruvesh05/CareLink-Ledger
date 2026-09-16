import { IVerifyResult, VerifiablePresentation, W3CVerifiableCredential, W3CVerifiablePresentation } from "@veramo/core-types";
import { createAgent } from "../agent/createAgent";
import { IVerifiablePresentation } from "../interfaces/IVerifiablePresentation";

export class PresentationService implements IVerifiablePresentation {
    async createPresentation(
        holderDid: string,
        credentials: W3CVerifiableCredential[],
        challenge?: string,
        domain?: string,
    ): Promise<VerifiablePresentation> {
        if (!holderDid || typeof holderDid !== "string" || !holderDid.trim()) {
            throw new Error("Holder DID is required.");
        }

        if (!Array.isArray(credentials) || credentials.length === 0) {
            throw new Error("At least one verifiable credential is required.");
        }

        const agent = await createAgent();

        if (!agent || typeof agent.createVerifiablePresentation !== "function") {
            throw new Error("Veramo presentation issuer is unavailable.");
        }

        try {
            return await agent.createVerifiablePresentation({
                presentation: {
                    "@context": ["https://www.w3.org/2018/credentials/v1"],
                    type: ["VerifiablePresentation"],
                    holder: holderDid.trim(),
                    verifiableCredential: credentials,
                },
                proofFormat: "jwt",
                ...(challenge !== undefined ? { challenge } : {}),
                ...(domain !== undefined ? { domain } : {}),
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown presentation creation error";
            throw new Error(`Failed to create verifiable presentation for holder "${holderDid}": ${message}`);
        }
    }

    async verifyPresentation(
        presentation: W3CVerifiablePresentation,
        challenge?: string,
        domain?: string,
    ): Promise<IVerifyResult> {
        if (!presentation || (typeof presentation === "string" && !presentation.trim())) {
            return {
                verified: false,
                error: {
                    message: "Presentation is required.",
                    errorCode: "invalid_argument",
                },
            };
        }

        const agent = await createAgent();

        if (!agent || typeof agent.verifyPresentation !== "function") {
            return {
                verified: false,
                error: {
                    message: "Veramo presentation verifier is unavailable.",
                    errorCode: "verification_unavailable",
                },
            };
        }

        try {
            const result = await agent.verifyPresentation({
                presentation,
                ...(challenge !== undefined ? { challenge } : {}),
                ...(domain !== undefined ? { domain } : {}),
            });

            if (result && typeof result.verified === "boolean") {
                return result;
            }

            return {
                verified: false,
                error: {
                    message: "Presentation verification failed.",
                    errorCode: "verification_failed",
                },
            };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown presentation verification error";

            return {
                verified: false,
                error: {
                    message,
                    errorCode: "verification_error",
                },
            };
        }
    }
}

export default new PresentationService();