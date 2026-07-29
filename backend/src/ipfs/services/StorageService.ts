import { InvalidMetadataInputError, MetadataService, MetadataServiceError } from "./MetadataService";
import { UploadService, UploadServiceError, type IUploadServiceResult } from "./UploadService";
import type { IFileMetadata } from "../interfaces/IFileMetadata";
import type { IStorageOptions } from "../interfaces/IStorageOptions";

export interface IStorageResult {
	readonly upload: IUploadServiceResult;
	readonly metadata: IFileMetadata;
}

export class StorageServiceError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = "StorageServiceError";
	}
}

export class StorageService {
	private readonly uploadService: UploadService;
	private readonly metadataService: MetadataService;

	constructor(
		uploadService: UploadService = new UploadService(),
		metadataService: MetadataService = new MetadataService()
	) {
		this.uploadService = uploadService;
		this.metadataService = metadataService;
	}

	async store(input: IStorageOptions): Promise<IStorageResult> {
		try {
			const upload = await this.uploadService.uploadFile(input.content);

			const metadata = this.metadataService.generateMetadata({
				cid: upload.cid,
				fileName: input.fileName,
				mimeType: input.mimeType,
				fileSize: upload.size,
				uploadedAt: input.uploadedAt
			});

			return {
				upload,
				metadata
			};
		} catch (error: unknown) {
			if (
				error instanceof StorageServiceError
				|| error instanceof UploadServiceError
				|| error instanceof MetadataServiceError
				|| error instanceof InvalidMetadataInputError
			) {
				throw error;
			}

			throw new StorageServiceError("Failed to store file in IPFS", error);
		}
	}
}
