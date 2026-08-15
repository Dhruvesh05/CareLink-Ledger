import { createAgent } from "../agent/createAgent";
import {
    IVerifiableCredentialVerification,
    IVerificationResult,
} from "../interfaces/IVerifiableCredentialVerification";

export class VerificationService implements IVerifiableCredentialVerification {
    async verifyCredential(credential: string | Record<string, unknown>): Promise<IVerificationResult> {
        if (!credential || (typeof credential === "string" && !credential.trim())) {
            return {
                verified: false,
                error: {
                    message: "Credential is required.",
                    errorCode: "invalid_argument",
                },
            };
        }

        const agent = await createAgent();

        if (!agent || typeof agent.verifyCredential !== "function") {
            return {
                verified: false,
                error: {
                    message: "Veramo credential verifier is unavailable.",
                    errorCode: "verification_unavailable",
                },
            };
        }

        try {
            const result = await agent.verifyCredential({ credential: credential as any });

            if (result && typeof result.verified === "boolean") {
                return {
                    verified: result.verified,
                    ...(result.error
                        ? {
                              error: {
                                  message: result.error.message ?? "Credential verification failed.",
                                  errorCode: result.error.errorCode ?? "verification_failed",
                              },
                          }
                        : {}),
                };
            }

            return {
                verified: false,
                error: {
                    message: "Credential verification failed.",
                    errorCode: "verification_failed",
                },
            };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential verification error";

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

export default new VerificationService();
