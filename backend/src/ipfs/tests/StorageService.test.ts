import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../services/UploadService", () => {
	class UploadService {}

	class UploadServiceError extends Error {
		constructor(message: string, public readonly cause?: unknown) {
			super(message);
			this.name = "UploadServiceError";
		}
	}

	return {
		UploadService,
		UploadServiceError
	};
});

jest.mock("../services/MetadataService", () => {
	class MetadataService {}

	class MetadataServiceError extends Error {
		constructor(message: string, public readonly cause?: unknown) {
			super(message);
			this.name = "MetadataServiceError";
		}
	}

	class InvalidMetadataInputError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "InvalidMetadataInputError";
		}
	}

	return {
		MetadataService,
		MetadataServiceError,
		InvalidMetadataInputError
	};
});

type MockUploadService = {
	uploadFile: jest.MockedFunction<(
		content: Buffer | Uint8Array | string,
		options?: { pin?: boolean }
	) => Promise<{
		cid: string;
		path: string;
		size: number;
		gatewayUrl: string;
	}>>;
};

type MockMetadataService = {
	generateMetadata: jest.MockedFunction<(input: {
		cid: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
		uploadedAt?: Date | string;
	}) => {
		cid: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
		uploadedAt: string;
	}>;
};

function createMockUploadService(): MockUploadService {
	return {
		uploadFile: jest.fn()
	};
}

function createMockMetadataService(): MockMetadataService {
	return {
		generateMetadata: jest.fn()
	};
}

describe("StorageService", () => {
	let StorageService: typeof import("../services/StorageService").StorageService;
	let StorageServiceError: typeof import("../services/StorageService").StorageServiceError;
	let InvalidMetadataInputError: typeof import("../services/MetadataService").InvalidMetadataInputError;
	let mockUploadService: MockUploadService;
	let mockMetadataService: MockMetadataService;

	beforeEach(async () => {
		jest.resetModules();
		mockUploadService = createMockUploadService();
		mockMetadataService = createMockMetadataService();

		const storageModule = await import("../services/StorageService");
		const metadataModule = await import("../services/MetadataService");

		StorageService = storageModule.StorageService;
		StorageServiceError = storageModule.StorageServiceError;
		InvalidMetadataInputError = metadataModule.InvalidMetadataInputError;
	});

	it("stores content by composing upload and metadata generation", async () => {
		mockUploadService.uploadFile.mockResolvedValue({
			cid: "bafy-storage-cid",
			path: "record.pdf",
			size: 2048,
			gatewayUrl: "http://gateway/ipfs/bafy-storage-cid"
		});
		mockMetadataService.generateMetadata.mockReturnValue({
			cid: "bafy-storage-cid",
			fileName: "record.pdf",
			mimeType: "application/pdf",
			fileSize: 2048,
			uploadedAt: "2025-01-15T10:00:00.000Z"
		});

		const service = new StorageService(
			mockUploadService as never,
			mockMetadataService as never
		);

		const result = await service.store({
			content: Buffer.from("record contents"),
			fileName: "record.pdf",
			mimeType: "application/pdf",
			uploadedAt: "2025-01-15T10:00:00.000Z"
		});

		expect(mockUploadService.uploadFile).toHaveBeenCalledWith(
			Buffer.from("record contents"),
			{
				pin: true
			}
		);
		expect(mockMetadataService.generateMetadata).toHaveBeenCalledWith({
			cid: "bafy-storage-cid",
			fileName: "record.pdf",
			mimeType: "application/pdf",
			fileSize: 2048,
			uploadedAt: "2025-01-15T10:00:00.000Z"
		});
		expect(result).toEqual({
			upload: {
				cid: "bafy-storage-cid",
				path: "record.pdf",
				size: 2048,
				gatewayUrl: "http://gateway/ipfs/bafy-storage-cid"
			},
			metadata: {
				cid: "bafy-storage-cid",
				fileName: "record.pdf",
				mimeType: "application/pdf",
				fileSize: 2048,
				uploadedAt: "2025-01-15T10:00:00.000Z"
			}
		});
	});

	it("wraps upload failures in StorageServiceError", async () => {
		const underlyingError = new Error("upload failed");
		mockUploadService.uploadFile.mockRejectedValue(underlyingError);

		const service = new StorageService(
			mockUploadService as never,
			mockMetadataService as never
		);

		await expect(
			service.store({
				content: Buffer.from("data"),
				fileName: "record.pdf",
				mimeType: "application/pdf"
			})
		).rejects.toBeInstanceOf(StorageServiceError);

		try {
			await service.store({
				content: Buffer.from("data"),
				fileName: "record.pdf",
				mimeType: "application/pdf"
			});
		} catch (error) {
			expect((error as Error).message).toBe("Failed to store file in IPFS");
			expect((error as { cause?: unknown }).cause).toBe(underlyingError);
		}
	});

	it("propagates metadata validation errors without wrapping them", async () => {
		mockUploadService.uploadFile.mockResolvedValue({
			cid: "bafy-storage-cid",
			path: "record.pdf",
			size: 2048,
			gatewayUrl: "http://gateway/ipfs/bafy-storage-cid"
		});
		mockMetadataService.generateMetadata.mockImplementation(() => {
			throw new InvalidMetadataInputError("File name is required");
		});

		const service = new StorageService(
			mockUploadService as never,
			mockMetadataService as never
		);

		await expect(
			service.store({
				content: Buffer.from("record contents"),
				fileName: "",
				mimeType: "application/pdf"
			})
		).rejects.toBeInstanceOf(InvalidMetadataInputError);
	});
});