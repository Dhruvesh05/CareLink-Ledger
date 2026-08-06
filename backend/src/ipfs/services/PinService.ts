import { ipfsClient, type IIPFSClient } from "../client/IPFSClient";

export class InvalidCidError extends Error {
	constructor(message = "Invalid IPFS CID") {
		super(message);
		this.name = "InvalidCidError";
	}
}

export class PinServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "PinServiceError";
	}
}

export class PinService {
	private readonly client: IIPFSClient;

	constructor(client: IIPFSClient = ipfsClient) {
		this.client = client;
	}

	async pinCid(cid: string): Promise<void> {
		this.validateCid(cid);

		try {
			await this.client.pin(cid.trim());
		} catch (error: unknown) {
			throw new PinServiceError("Failed to pin CID on IPFS", error);
		}
	}

	async unpinCid(cid: string): Promise<void> {
		this.validateCid(cid);

		try {
			await this.client.unpin(cid.trim());
		} catch (error: unknown) {
			throw new PinServiceError("Failed to unpin CID from IPFS", error);
		}
	}

	async isPinned(cid: string): Promise<boolean> {
		this.validateCid(cid);

		try {
			return await this.client.isPinned(cid.trim());
		} catch (error: unknown) {
			if (this.isInvalidCidError(error)) {
				throw new InvalidCidError();
			}

			throw new PinServiceError("Failed to check pinned state for CID", error);
		}
	}

	private validateCid(cid: string): void {
		if (!cid || cid.trim().length === 0) {
			throw new InvalidCidError("CID is required");
		}

		if (/\s/.test(cid)) {
			throw new InvalidCidError("CID must not contain whitespace");
		}
	}

	private isInvalidCidError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		const message = error.message.toLowerCase();

		return message.includes("invalid cid")
			|| message.includes("failed to parse cid")
			|| message.includes("multiformats")
			|| message.includes("cid");
	}
}
