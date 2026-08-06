import type { IFileMetadata } from "../interfaces/IFileMetadata";

export interface IMetadataInput {
	readonly cid: string;
	readonly fileName: string;
	readonly mimeType: string;
	readonly fileSize: number;
	readonly uploadedAt?: Date | string;
}

export class MetadataServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "MetadataServiceError";
	}
}

export class InvalidMetadataInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidMetadataInputError";
	}
}

export class MetadataService {
	generateMetadata(input: IMetadataInput): IFileMetadata {
		this.validateInput(input);

		try {
			return {
				cid: input.cid.trim(),
				fileName: input.fileName.trim(),
				mimeType: input.mimeType.trim(),
				fileSize: input.fileSize,
				uploadedAt: this.normalizeTimestamp(input.uploadedAt)
			};
		} catch (error: unknown) {
			if (error instanceof InvalidMetadataInputError) {
				throw error;
			}

			throw new MetadataServiceError("Failed to generate file metadata", error);
		}
	}

	private validateInput(input: IMetadataInput): void {
		if (!input.cid || input.cid.trim().length === 0) {
			throw new InvalidMetadataInputError("CID is required");
		}

		if (!input.fileName || input.fileName.trim().length === 0) {
			throw new InvalidMetadataInputError("File name is required");
		}

		if (!input.mimeType || input.mimeType.trim().length === 0) {
			throw new InvalidMetadataInputError("MIME type is required");
		}

		if (!Number.isFinite(input.fileSize) || input.fileSize < 0) {
			throw new InvalidMetadataInputError("File size must be a non-negative finite number");
		}
	}

	private normalizeTimestamp(value?: Date | string): string {
		if (value instanceof Date) {
			return value.toISOString();
		}

		if (typeof value === "string" && value.trim().length > 0) {
			const parsed = new Date(value);

			if (Number.isNaN(parsed.getTime())) {
				throw new InvalidMetadataInputError("Uploaded timestamp is invalid");
			}

			return parsed.toISOString();
		}

		return new Date().toISOString();
	}
}
