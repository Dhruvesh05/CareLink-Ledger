import { createAgent } from "../agent/createAgent";
import { ICredentialPersistenceService } from "../interfaces/ICredentialPersistenceService";

function isValidCredential(credential: Record<string, any>): boolean {
    if (!credential || typeof credential !== "object") return false;
    if (!Array.isArray(credential["@context"]) || credential["@context"].length === 0) return false;
    if (!Array.isArray(credential.type) || credential.type.length === 0) return false;
    if (!credential.issuer) return false;
    if (!credential.credentialSubject || typeof credential.credentialSubject !== "object") return false;
    if (!credential.credentialSubject.id || typeof credential.credentialSubject.id !== "string") return false;
    return true;
}

export class CredentialPersistenceService implements ICredentialPersistenceService {
    async saveCredential(credential: Record<string, any>): Promise<string> {
        if (!isValidCredential(credential)) {
            throw new Error("Credential is required and must include @context, type, issuer, and credentialSubject.id.");
        }

        const agent = await createAgent();
        if (!agent || typeof agent.dataStoreSaveVerifiableCredential !== "function") {
            throw new Error("Veramo credential data store is unavailable.");
        }

        try {
            return await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: credential });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential persistence error";
            throw new Error(`Failed to save credential: ${message}`);
        }
    }

    async getCredential(id: string): Promise<Record<string, any> | null> {
        if (!id || typeof id !== "string" || !id.trim()) {
            throw new Error("Credential ID is required.");
        }

        const agent = await createAgent();
        if (!agent || typeof agent.dataStoreGetVerifiableCredential !== "function") {
            throw new Error("Veramo credential data store is unavailable.");
        }

        try {
            return await agent.dataStoreGetVerifiableCredential({ hash: id.trim() });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential retrieval error";
            if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("not_found")) {
                return null;
            }
            throw new Error(`Failed to get credential "${id}": ${message}`);
        }
    }

    async getCredentialsBySubject(subjectDid: string): Promise<Record<string, any>[]> {
        if (!subjectDid || typeof subjectDid !== "string" || !subjectDid.trim()) {
            throw new Error("Subject DID is required.");
        }

        const agent = await createAgent();
        if (!agent || typeof agent.dataStoreORMGetVerifiableCredentialsByClaims !== "function") {
            throw new Error("Veramo credential query API is unavailable.");
        }

        try {
            const result = await agent.dataStoreORMGetVerifiableCredentialsByClaims(
                {
                    where: [{ column: "subject", value: [subjectDid.trim()] }],
                },
                {},
            );

            return Array.isArray(result) ? result.map((item: any) => item.verifiableCredential ?? item) : [];
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential query error";
            throw new Error(`Failed to get credentials for subject "${subjectDid}": ${message}`);
        }
    }
}

export default new CredentialPersistenceService();
