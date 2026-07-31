import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../client/IPFSClient", () => ({
	ipfsClient: {}
}));

type MockIpfClient = {
	cat: jest.MockedFunction<(cid: string) => Promise<Uint8Array>>;
};

function createMockClient(): MockIpfClient {
	return {
		cat: jest.fn()
	};
}

describe("DownloadService", () => {
	let DownloadService: typeof import("../services/DownloadService").DownloadService;
	let InvalidCidError: typeof import("../services/DownloadService").InvalidCidError;
	let DownloadServiceError: typeof import("../services/DownloadService").DownloadServiceError;
	let mockClient: MockIpfClient;

	beforeEach(async () => {
		jest.resetModules();
		mockClient = createMockClient();

		const module = await import("../services/DownloadService");
		DownloadService = module.DownloadService;
		InvalidCidError = module.InvalidCidError;
		DownloadServiceError = module.DownloadServiceError;
	});

	it("downloads file content as a Buffer", async () => {
		mockClient.cat.mockResolvedValue(Uint8Array.from([1, 2, 3, 4]));

		const service = new DownloadService(mockClient as never);
		const result = await service.downloadFile("bafy-download-cid");

		expect(mockClient.cat).toHaveBeenCalledWith("bafy-download-cid");
		expect(Buffer.isBuffer(result)).toBe(true);
		expect(Array.from(result)).toEqual([1, 2, 3, 4]);
	});

	it("rejects empty CID input before calling the client", async () => {
		const service = new DownloadService(mockClient as never);

		await expect(service.downloadFile("")).rejects.toBeInstanceOf(InvalidCidError);
		expect(mockClient.cat).not.toHaveBeenCalled();
	});

	it("rejects whitespace-only CID input before calling the client", async () => {
		const service = new DownloadService(mockClient as never);

		await expect(service.downloadFile("   ")).rejects.toBeInstanceOf(InvalidCidError);
		expect(mockClient.cat).not.toHaveBeenCalled();
	});

	it("normalizes invalid CID errors from the IPFS client", async () => {
		mockClient.cat.mockRejectedValue(new Error("failed to parse CID: invalid CID"));

		const service = new DownloadService(mockClient as never);

		await expect(service.downloadFile("bad-cid")).rejects.toBeInstanceOf(InvalidCidError);
	});

	it("wraps operational download failures in DownloadServiceError", async () => {
		const underlyingError = new Error("network down");
		mockClient.cat.mockRejectedValue(underlyingError);

		const service = new DownloadService(mockClient as never);

		await expect(service.downloadFile("bafy-failure-cid")).rejects.toBeInstanceOf(DownloadServiceError);

		try {
			await service.downloadFile("bafy-failure-cid");
		} catch (error) {
			expect((error as Error).message).toBe("Failed to download content from IPFS");
			expect((error as { cause?: unknown }).cause).toBe(underlyingError);
		}
	});
});