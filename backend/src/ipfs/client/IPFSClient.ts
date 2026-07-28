import { create, type IPFSHTTPClient } from "ipfs-http-client";

import { ipfsConfig, type IIpfsConfig } from "../config/ipfs.config";

export interface IIPFSAddResult {
	readonly cid: string;
	readonly path: string;
	readonly size: number;
}

export interface IIPFSClient {
	add(content: string | Uint8Array | Buffer, pin?: boolean): Promise<IIPFSAddResult>;
	cat(cid: string): Promise<Uint8Array>;
	pin(cid: string): Promise<void>;
	unpin(cid: string): Promise<void>;
	getGatewayUrl(cid: string): string;
	ping(): Promise<boolean>;
}

export class IPFSClient implements IIPFSClient {
	private readonly client: IPFSHTTPClient;

	private readonly config: IIpfsConfig;

	constructor(config: IIpfsConfig = ipfsConfig) {
		this.config = config;
		this.client = create({
			url: config.apiUrl,
			timeout: config.timeout
		});
	}

	async add(
		content: string | Uint8Array | Buffer,
		pin = true
	): Promise<IIPFSAddResult> {
		const result = await this.client.add(content, {
			pin
		});

		return {
			cid: result.cid.toString(),
			path: result.path,
			size: result.size
		};
	}

	async cat(cid: string): Promise<Uint8Array> {
		const chunks: Uint8Array[] = [];

		for await (const chunk of this.client.cat(cid)) {
			chunks.push(chunk);
		}

		if (chunks.length === 0) {
			return new Uint8Array();
		}

		const totalLength = chunks.reduce(
			(length, chunk) => length + chunk.length,
			0
		);

		const data = new Uint8Array(totalLength);
		let offset = 0;

		for (const chunk of chunks) {
			data.set(chunk, offset);
			offset += chunk.length;
		}

		return data;
	}

	async pin(cid: string): Promise<void> {
		await this.client.pin.add(cid);
	}

	async unpin(cid: string): Promise<void> {
		await this.client.pin.rm(cid);
	}

	getGatewayUrl(cid: string): string {
		return `${this.config.gatewayUrl}/${cid}`;
	}

	async ping(): Promise<boolean> {
		try {
			await this.client.version();
			return true;
		} catch {
			return false;
		}
	}
}

export const ipfsClient = new IPFSClient();
