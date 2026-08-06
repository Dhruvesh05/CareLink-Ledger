import { Buffer } from "buffer";

import { ipfsClient, type IIPFSClient } from "../client/IPFSClient";

export class InvalidCidError extends Error {
	constructor(message = "Invalid IPFS CID") {
		super(message);
		this.name = "InvalidCidError";
	}
}

export class DownloadServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "DownloadServiceError";
	}
}

export class DownloadService {
	private readonly client: IIPFSClient;

	constructor(client: IIPFSClient = ipfsClient) {
		this.client = client;
	}

	async downloadFile(cid: string): Promise<Buffer> {
		this.validateCid(cid);

		try {
			const data = await this.client.cat(cid.trim());
			return Buffer.from(data);
		} catch (error: unknown) {
			if (this.isInvalidCidError(error)) {
				throw new InvalidCidError();
			}

			throw new DownloadServiceError("Failed to download content from IPFS", error);
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
			|| message.includes("cannot parse cid")
			|| message.includes("multiformats/cid");
	}
}
