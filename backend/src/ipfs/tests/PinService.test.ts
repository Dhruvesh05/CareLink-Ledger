import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../client/IPFSClient", () => ({
	ipfsClient: {}
}));

type MockIpfClient = {
	pin: jest.MockedFunction<(cid: string) => Promise<void>>;
	unpin: jest.MockedFunction<(cid: string) => Promise<void>>;
	isPinned: jest.MockedFunction<(cid: string) => Promise<boolean>>;
};

function createMockClient(): MockIpfClient {
	return {
		pin: jest.fn(),
		unpin: jest.fn(),
		isPinned: jest.fn()
	};
}

describe("PinService", () => {
	let PinService: typeof import("../services/PinService").PinService;
	let InvalidCidError: typeof import("../services/PinService").InvalidCidError;
	let PinServiceError: typeof import("../services/PinService").PinServiceError;
	let mockClient: MockIpfClient;

	beforeEach(async () => {
		jest.resetModules();
		mockClient = createMockClient();

		const module = await import("../services/PinService");
		PinService = module.PinService;
		InvalidCidError = module.InvalidCidError;
		PinServiceError = module.PinServiceError;
	});

	it("pins a CID", async () => {
		const service = new PinService(mockClient as never);

		await service.pinCid("bafy-pin-cid");

		expect(mockClient.pin).toHaveBeenCalledWith("bafy-pin-cid");
	});

	it("unpins a CID", async () => {
		const service = new PinService(mockClient as never);

		await service.unpinCid("bafy-unpin-cid");

		expect(mockClient.unpin).toHaveBeenCalledWith("bafy-unpin-cid");
	});

	it("reports true when the client confirms the CID is pinned", async () => {
		mockClient.isPinned.mockResolvedValue(true);

		const service = new PinService(mockClient as never);
		const result = await service.isPinned("bafy-pinned-cid");

		expect(mockClient.isPinned).toHaveBeenCalledWith("bafy-pinned-cid");
		expect(result).toBe(true);
	});

	it("reports false when the client confirms the CID is not pinned", async () => {
		mockClient.isPinned.mockResolvedValue(false);

		const service = new PinService(mockClient as never);
		const result = await service.isPinned("bafy-missing-cid");

		expect(result).toBe(false);
	});

	it("rejects empty CID input before client interaction", async () => {
		const service = new PinService(mockClient as never);

		await expect(service.pinCid("")).rejects.toBeInstanceOf(InvalidCidError);
		await expect(service.unpinCid(" ")).rejects.toBeInstanceOf(InvalidCidError);
		await expect(service.isPinned("")).rejects.toBeInstanceOf(InvalidCidError);

		expect(mockClient.pin).not.toHaveBeenCalled();
		expect(mockClient.unpin).not.toHaveBeenCalled();
		expect(mockClient.isPinned).not.toHaveBeenCalled();
	});

	it("wraps pin failures in PinServiceError", async () => {
		const underlyingError = new Error("pin failed");
		mockClient.pin.mockRejectedValue(underlyingError);

		const service = new PinService(mockClient as never);

		await expect(service.pinCid("bafy-pin-cid")).rejects.toBeInstanceOf(PinServiceError);

		try {
			await service.pinCid("bafy-pin-cid");
		} catch (error) {
			expect((error as Error).message).toBe("Failed to pin CID on IPFS");
			expect((error as { cause?: unknown }).cause).toBe(underlyingError);
		}
	});

	it("wraps unpin failures in PinServiceError", async () => {
		const underlyingError = new Error("unpin failed");
		mockClient.unpin.mockRejectedValue(underlyingError);

		const service = new PinService(mockClient as never);

		await expect(service.unpinCid("bafy-unpin-cid")).rejects.toBeInstanceOf(PinServiceError);
	});

	it("normalizes invalid CID errors reported by the client", async () => {
		mockClient.isPinned.mockRejectedValue(new Error("failed to parse CID"));

		const service = new PinService(mockClient as never);

		await expect(service.isPinned("bad-cid")).rejects.toBeInstanceOf(InvalidCidError);
	});

	it("wraps pinned-state lookup failures in PinServiceError", async () => {
		const underlyingError = new Error("network down");
		mockClient.isPinned.mockRejectedValue(underlyingError);

		const service = new PinService(mockClient as never);

		await expect(service.isPinned("bafy-failure-cid")).rejects.toBeInstanceOf(PinServiceError);
	});
});