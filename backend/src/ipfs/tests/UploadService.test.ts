import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../client/IPFSClient", () => ({
	ipfsClient: {}
}));

type UploadResult = {
	cid: string;
	path: string;
	size: number;
};

type MockIpfClient = {
	add: jest.MockedFunction<(
		content: string | Uint8Array | Buffer,
		pin?: boolean
	) => Promise<UploadResult>>;
	getGatewayUrl: jest.MockedFunction<(cid: string) => string>;
};

function createMockClient(): MockIpfClient {
	return {
		add: jest.fn(),
		getGatewayUrl: jest.fn()
	};
}

describe("UploadService", () => {
	let UploadService: typeof import("../services/UploadService").UploadService;
	let UploadServiceError: typeof import("../services/UploadService").UploadServiceError;
	let mockClient: MockIpfClient;

	beforeEach(async () => {
		jest.resetModules();
		mockClient = createMockClient();

		const module = await import("../services/UploadService");
		UploadService = module.UploadService;
		UploadServiceError = module.UploadServiceError;
	});

	it("uploads content with pin disabled by default and returns normalized result", async () => {
		mockClient.add.mockResolvedValue({
			cid: "bafy-upload-cid",
			path: "record.pdf",
			size: 512
		});
		mockClient.getGatewayUrl.mockReturnValue("http://gateway/ipfs/bafy-upload-cid");

		const service = new UploadService(mockClient as never);
		const content = Buffer.from("medical file contents");

		const result = await service.uploadFile(content);

		expect(mockClient.add).toHaveBeenCalledWith(content, false);
		expect(mockClient.getGatewayUrl).toHaveBeenCalledWith("bafy-upload-cid");
		expect(result).toEqual({
			cid: "bafy-upload-cid",
			path: "record.pdf",
			size: 512,
			gatewayUrl: "http://gateway/ipfs/bafy-upload-cid"
		});
	});

	it("uploads content with pin enabled when requested", async () => {
		mockClient.add.mockResolvedValue({
			cid: "bafy-pinned-cid",
			path: "signed.pdf",
			size: 128
		});
		mockClient.getGatewayUrl.mockReturnValue("http://gateway/ipfs/bafy-pinned-cid");

		const service = new UploadService(mockClient as never);

		await service.uploadFile("hello", { pin: true });

		expect(mockClient.add).toHaveBeenCalledWith("hello", true);
	});

	it("delegates uploadText to uploadFile", async () => {
		mockClient.add.mockResolvedValue({
			cid: "bafy-text-cid",
			path: "note.txt",
			size: 64
		});
		mockClient.getGatewayUrl.mockReturnValue("http://gateway/ipfs/bafy-text-cid");

		const service = new UploadService(mockClient as never);

		const result = await service.uploadText("hello world", { pin: true });

		expect(mockClient.add).toHaveBeenCalledWith("hello world", true);
		expect(result.cid).toBe("bafy-text-cid");
	});

	it("wraps client failures in UploadServiceError", async () => {
		const underlyingError = new Error("ipfs unavailable");
		mockClient.add.mockRejectedValue(underlyingError);

		const service = new UploadService(mockClient as never);

		await expect(service.uploadFile(Buffer.from("data"))).rejects.toBeInstanceOf(UploadServiceError);

		try {
			await service.uploadFile(Buffer.from("data"));
		} catch (error) {
			expect(error).toBeInstanceOf(UploadServiceError);
			expect((error as Error).message).toBe("Failed to upload content to IPFS");
			expect((error as { cause?: unknown }).cause).toBe(underlyingError);
		}
	});
});