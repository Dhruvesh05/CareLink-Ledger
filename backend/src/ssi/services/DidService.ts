import { createAgent } from "../agent/createAgent";
import { IDID } from "../interfaces/IDID";

export class DidService implements IDID {
    async createDid(alias?: string): Promise<string> {
        const agent = await createAgent();

        if (!agent || typeof agent.didManagerCreate !== "function") {
            throw new Error("Veramo DID manager is unavailable.");
        }

        const created = await agent.didManagerCreate({
            provider: "did:key",
            alias: alias ?? `carelink-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        });

        if (!created || !created.did) {
            throw new Error("Failed to create DID with did:key provider.");
        }

        return created.did;
    }

    async resolveDid(did: string): Promise<any> {
        if (!did || typeof did !== "string" || !did.trim()) {
            throw new Error("DID is required.");
        }

        const agent = await createAgent();

        if (!agent || typeof agent.resolveDid !== "function") {
            throw new Error("Veramo DID resolver is unavailable.");
        }

        try {
            return await agent.resolveDid({ didUrl: did.trim() });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown DID resolution error";
            throw new Error(`Failed to resolve DID "${did}": ${message}`);
        }
    }

    async getDid(did: string): Promise<any> {
        return this.resolveDid(did);
    }
}

export default new DidService();
