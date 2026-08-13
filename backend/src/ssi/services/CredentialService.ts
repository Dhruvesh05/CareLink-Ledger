import { createAgent } from "../agent/createAgent";
import { IVerifiableCredential } from "../interfaces/IVerifiableCredential";

export class CredentialService implements IVerifiableCredential {
    async issueCredential(
        issuerDid: string,
        subjectDid: string,
        credentialSubject: Record<string, unknown>,
    ): Promise<any> {
        if (!issuerDid || typeof issuerDid !== "string" || !issuerDid.trim()) {
            throw new Error("Issuer DID is required.");
        }

        if (!subjectDid || typeof subjectDid !== "string" || !subjectDid.trim()) {
            throw new Error("Subject DID is required.");
        }

        if (!credentialSubject || typeof credentialSubject !== "object" || Array.isArray(credentialSubject)) {
            throw new Error("Credential subject is required.");
        }

        const agent = await createAgent();

        if (!agent || typeof agent.createVerifiableCredential !== "function") {
            throw new Error("Veramo credential issuer is unavailable.");
        }

        const credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential", "IdentityCredential"],
            issuer: issuerDid.trim(),
            credentialSubject: {
                id: subjectDid.trim(),
                ...credentialSubject,
            },
        };

        try {
            return await agent.createVerifiableCredential({
                credential,
                proofFormat: "jwt",
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential issuance error";
            throw new Error(`Failed to issue credential for issuer "${issuerDid}": ${message}`);
        }
    }
}

export default new CredentialService();
