import { ipfsClient, type IIPFSClient } from "../client/IPFSClient";
import type { IUploadResult } from "../interfaces/IUploadResult";

export type UploadableContent = Buffer | Uint8Array | string;

export interface IUploadOptions {
	readonly pin?: boolean;
}

export type IUploadServiceResult = IUploadResult;

export class UploadServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "UploadServiceError";
	}
}

export class UploadService {
	private readonly client: IIPFSClient;

	constructor(client: IIPFSClient = ipfsClient) {
		this.client = client;
	}

	async uploadFile(
		content: UploadableContent,
		options: IUploadOptions = {}
	): Promise<IUploadServiceResult> {
		try {
			const result = await this.client.add(content, options.pin ?? false);

			return {
				cid: result.cid,
				path: result.path,
				size: result.size,
				gatewayUrl: this.client.getGatewayUrl(result.cid)
			};
		} catch (error: unknown) {
			throw new UploadServiceError("Failed to upload content to IPFS", error);
		}
	}

	async uploadText(
		text: string,
		options: IUploadOptions = {}
	): Promise<IUploadServiceResult> {
		return this.uploadFile(text, options);
	}
}
