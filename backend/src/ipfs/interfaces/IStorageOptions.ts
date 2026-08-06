export interface IStorageOptions {
	readonly content: Buffer | Uint8Array | string;
	readonly fileName: string;
	readonly mimeType: string;
	readonly uploadedAt?: Date | string;
}
