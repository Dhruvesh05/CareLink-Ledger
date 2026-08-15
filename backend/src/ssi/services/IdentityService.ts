import { createAgent } from "../agent/createAgent";
import { IIdentity } from "../interfaces/IIdentity";
import { IIdentityService } from "../interfaces/IIdentityService";
import CredentialService from "./CredentialService";
import DidService from "./DidService";

export class IdentityService implements IIdentityService {
    async createIdentity(alias?: string): Promise<IIdentity> {
        const did = await DidService.createDid(alias);
        return {
            did,
            ...(alias ? { alias } : {}),
        };
    }

    async getIdentityByDid(did: string): Promise<IIdentity | null> {
        if (!did || typeof did !== "string" || !did.trim()) {
            throw new Error("DID is required.");
        }

        const agent = await createAgent();
        if (!agent || typeof agent.didManagerGet !== "function") {
            throw new Error("Veramo DID manager is unavailable.");
        }

        try {
            const result = await agent.didManagerGet({ did: did.trim() });
            if (!result) {
                return null;
            }

            return {
                did: result.did,
                ...(result.alias ? { alias: result.alias } : {}),
            };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown DID lookup error";
            if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("not_found")) {
                return null;
            }
            throw new Error(`Failed to get identity for DID "${did}": ${message}`);
        }
    }

    async getIdentities(): Promise<IIdentity[]> {
        const agent = await createAgent();
        if (!agent || typeof agent.didManagerFind !== "function") {
            throw new Error("Veramo DID manager is unavailable.");
        }

        const results = await agent.didManagerFind({});

        return (Array.isArray(results) ? results : []).map((item: any) => ({
            did: item?.did,
            ...(item?.alias ? { alias: item.alias } : {}),
        }));
    }

    async issueCredentialForIdentity(
        identityDid: string,
        issuerDid: string,
        credentialSubject: Record<string, unknown>,
    ): Promise<any> {
        if (!identityDid || typeof identityDid !== "string" || !identityDid.trim()) {
            throw new Error("Identity DID is required.");
        }

        const identity = await this.getIdentityByDid(identityDid.trim());
        if (!identity) {
            throw new Error(`Identity does not exist for DID "${identityDid}".`);
        }

        return CredentialService.issueCredential(issuerDid, identity.did, credentialSubject);
    }
}

export default new IdentityService();
