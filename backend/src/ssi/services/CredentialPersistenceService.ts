import { createAgent } from "../agent/createAgent";
import { ICredentialPersistenceService } from "../interfaces/ICredentialPersistenceService";
import EncryptedCredentialReferenceModel from "../../models/EncryptedCredentialReferenceModel";
import IPFSServiceAdapter from "../../ipfs/adapters/IPFSServiceAdapter";
import { sha256FromBuffer, verifySha256 } from "../../utils/hash";
import {
    KeyManagement,
    keyManagementService as defaultKeyManagementService
} from "../../services/encryption/KeyManagementService";
import { MedicalRecordEncryptionService } from "../../services/encryption/MedicalRecordEncryptionService";

const inFlightCredentialReferences = new Map<
    string,
    Promise<{ credentialId: string; referenceId: string; cid: string }>
>();

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
    constructor(
        private readonly agentFactory: typeof createAgent = createAgent,
        private readonly ipfsService = new IPFSServiceAdapter(),
        private readonly keyManagementService: KeyManagement = defaultKeyManagementService,
        private readonly encryptionService = new MedicalRecordEncryptionService()
    ) {}

    async saveCredential(credential: Record<string, any>): Promise<string> {
        this.validateCredential(credential);
        const agent = await this.agentFactory();
        if (!agent || typeof agent.dataStoreSaveVerifiableCredential !== "function") {
            throw new Error("Veramo credential data store is unavailable.");
        }

        try {
            return await agent.dataStoreSaveVerifiableCredential({
                verifiableCredential: credential
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential persistence error";
            throw new Error(`Failed to save credential: ${message}`);
        }
    }

    async saveCredentialToIpfs(
        credential: Record<string, any>,
        userId: string,
        subjectDid: string
    ): Promise<{ credentialId: string; referenceId: string; cid: string }> {
        this.validateCredential(credential);
        if (!userId?.trim()) {
            throw new Error("Application user ID is required.");
        }
        if (!subjectDid?.trim() || credential.credentialSubject.id !== subjectDid.trim()) {
            throw new Error("Credential subject DID does not match the application identity.");
        }

        const credentialId = await this.saveCredential(credential);
        const existing = await EncryptedCredentialReferenceModel.findOne({
            userId: userId.trim(),
            credentialId
        });
        if (existing) {
            return {
                credentialId,
                referenceId: String(existing._id),
                cid: existing.cid
            };
        }

        const referenceKey = `${userId.trim()}:${credentialId}`;
        const inFlight = inFlightCredentialReferences.get(referenceKey);
        if (inFlight) {
            return inFlight;
        }

        const persistence = this.persistEncryptedCredentialReference(
            credential,
            userId.trim(),
            subjectDid.trim(),
            credentialId
        );
        inFlightCredentialReferences.set(referenceKey, persistence);
        try {
            return await persistence;
        } finally {
            inFlightCredentialReferences.delete(referenceKey);
        }
    }

    private async persistEncryptedCredentialReference(
        credential: Record<string, any>,
        userId: string,
        subjectDid: string,
        credentialId: string
    ): Promise<{ credentialId: string; referenceId: string; cid: string }> {
        const managedKey = await this.keyManagementService.createKey();
        const encrypted = this.encryptionService.encrypt(
            Buffer.from(JSON.stringify(credential), "utf8"),
            managedKey.key,
            managedKey.reference
        );
        const encryptedHash = sha256FromBuffer(encrypted.ciphertext);
        let upload: { cid: string };

        try {
            upload = await this.ipfsService.uploadFile(
                encrypted.ciphertext,
                `credential-${credentialId}.json`,
                "application/octet-stream"
            );
        } catch (error) {
            throw new Error(
                `Failed to persist encrypted credential to IPFS: ${
                    error instanceof Error ? error.message : "unknown error"
                }`
            );
        }

        try {
            const reference = await EncryptedCredentialReferenceModel.create({
                userId,
                subjectDid,
                credentialId,
                cid: upload.cid,
                encryptedHash,
                encryptionVersion: encrypted.metadata.version,
                encryptionAlgorithm: encrypted.metadata.algorithm,
                encryptionIv: encrypted.metadata.iv,
                encryptionAuthTag: encrypted.metadata.authTag,
                encryptionKeyReference: encrypted.metadata.keyReference
            });
            return {
                credentialId,
                referenceId: String(reference._id),
                cid: upload.cid
            };
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                (error as { code?: number }).code === 11000
            ) {
                const existing = await EncryptedCredentialReferenceModel.findOne({
                    userId,
                    credentialId
                });
                if (existing) {
                    return {
                        credentialId,
                        referenceId: String(existing._id),
                        cid: existing.cid
                    };
                }
            }
            throw new Error(
                `Failed to persist encrypted credential reference: ${
                    error instanceof Error ? error.message : "unknown error"
                }`
            );
        }
    }

    async getCredentialFromIpfs(
        referenceId: string,
        userId: string,
        subjectDid: string
    ): Promise<Record<string, any> | null> {
        if (!referenceId?.trim() || !userId?.trim() || !subjectDid?.trim()) {
            throw new Error("Credential reference, application user ID, and subject DID are required.");
        }
        const reference = await EncryptedCredentialReferenceModel.findOne({
            _id: referenceId.trim(),
            userId: userId.trim(),
            subjectDid: subjectDid.trim()
        });
        if (!reference) return null;

        const content = await this.ipfsService.downloadFile(reference.cid);
        if (!verifySha256(content, reference.encryptedHash)) {
            throw new Error("Encrypted credential integrity verification failed.");
        }
        const key = await this.keyManagementService.getKey(reference.encryptionKeyReference);
        const credential = JSON.parse(
            this.encryptionService.decrypt(content, key, {
                version: reference.encryptionVersion,
                algorithm: reference.encryptionAlgorithm as any,
                iv: reference.encryptionIv,
                authTag: reference.encryptionAuthTag,
                keyReference: reference.encryptionKeyReference
            }).toString("utf8")
        );

        const agent = await this.agentFactory();
        if (typeof agent.verifyCredential !== "function") {
            throw new Error("Veramo credential verification is unavailable.");
        }
        const verification = await agent.verifyCredential({ credential });
        if (verification?.verified === false) {
            throw new Error("Persisted credential failed Veramo verification.");
        }
        return credential;
    }

    async getCredential(id: string): Promise<Record<string, any> | null> {
        if (!id || typeof id !== "string" || !id.trim()) {
            throw new Error("Credential ID is required.");
        }
        const agent = await this.agentFactory();
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
        const agent = await this.agentFactory();
        if (!agent || typeof agent.dataStoreORMGetVerifiableCredentialsByClaims !== "function") {
            throw new Error("Veramo credential query API is unavailable.");
        }
        try {
            const result = await agent.dataStoreORMGetVerifiableCredentialsByClaims(
                { where: [{ column: "subject", value: [subjectDid.trim()] }] },
                {}
            );
            return Array.isArray(result)
                ? result.map((item: any) => item.verifiableCredential ?? item)
                : [];
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown credential query error";
            throw new Error(`Failed to get credentials for subject "${subjectDid}": ${message}`);
        }
    }

    private validateCredential(credential: Record<string, any>): void {
        if (!isValidCredential(credential)) {
            throw new Error("Credential is required and must include @context, type, issuer, and credentialSubject.id.");
        }
    }
}

export default new CredentialPersistenceService();
