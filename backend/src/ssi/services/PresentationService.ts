import { IVerifyResult, VerifiablePresentation, W3CVerifiableCredential, W3CVerifiablePresentation } from "@veramo/core-types";
import { createAgent } from "../agent/createAgent";
import { IVerifiablePresentation } from "../interfaces/IVerifiablePresentation";

export class PresentationService implements IVerifiablePresentation {
    private isValidDid(value: unknown): value is string {
        return (
            typeof value === "string" &&
            value.trim().startsWith("did:")
        );
    }

    private isValidCredential(value: unknown): value is W3CVerifiableCredential {
        if (typeof value === "string") {
            return value.trim().length > 0;
        }

        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return false;
        }

        const credential = value as Record<string, unknown>;
        return Boolean(
            credential.proof &&
            typeof credential.proof === "object" &&
            credential.credentialSubject &&
            typeof credential.credentialSubject === "object" &&
            !Array.isArray(credential.credentialSubject)
        );
    }

    private isValidPresentation(value: unknown): value is W3CVerifiablePresentation {
        if (typeof value === "string") {
            return value.trim().length > 0;
        }

        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return false;
        }

        const presentation = value as Record<string, unknown>;
        const credentials = presentation.verifiableCredential;

        return Boolean(
            this.isValidDid(presentation.holder) &&
            presentation.proof &&
            typeof presentation.proof === "object" &&
            Array.isArray(credentials) &&
            credentials.length > 0 &&
            credentials.every((credential) => this.isValidCredential(credential))
        );
    }

    async createPresentation(
        holderDid: string,
        credentials: W3CVerifiableCredential[],
        challenge: string,
        domain?: string,
    ): Promise<VerifiablePresentation> {
        if (!this.isValidDid(holderDid)) {
            throw new Error("Holder DID is required.");
        }

        if (!Array.isArray(credentials) || credentials.length === 0) {
            throw new Error("At least one verifiable credential is required.");
        }

        if (!credentials.every((credential) => this.isValidCredential(credential))) {
            throw new Error("All verifiable credentials must be valid.");
        }

        if (typeof challenge !== "string" || !challenge.trim()) {
            throw new Error("Challenge is required.");
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
                challenge,
                ...(domain !== undefined ? { domain } : {}),
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown presentation creation error";
            throw new Error(`Failed to create verifiable presentation for holder "${holderDid}": ${message}`);
        }
    }

    async verifyPresentation(
        presentation: W3CVerifiablePresentation,
        challenge: string,
        domain?: string,
    ): Promise<IVerifyResult> {
        if (!this.isValidPresentation(presentation)) {
            return {
                verified: false,
                error: {
                    message: "Presentation is malformed.",
                    errorCode: "invalid_argument",
                },
            };
        }

        if (typeof challenge !== "string" || !challenge.trim()) {
            return {
                verified: false,
                error: {
                    message: "Challenge is required.",
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
                challenge,
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