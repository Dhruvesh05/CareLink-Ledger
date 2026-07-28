import { ipfsClient, type IIPFSClient } from "../client/IPFSClient";

export type UploadableContent = Buffer | Uint8Array | string;

export interface IUploadResult {
	readonly cid: string;
	readonly path: string;
	readonly size: number;
	readonly gatewayUrl: string;
}

export interface IUploadServiceResult extends IUploadResult {
	readonly cid: string;
	readonly path: string;
	readonly size: number;
	readonly gatewayUrl: string;
}

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

	async uploadFile(content: UploadableContent): Promise<IUploadServiceResult> {
		try {
			const result = await this.client.add(content, true);

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

	async uploadText(text: string): Promise<IUploadServiceResult> {
		return this.uploadFile(text);
	}
}
