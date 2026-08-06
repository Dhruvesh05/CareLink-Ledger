import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreate = jest.fn();

jest.mock("ipfs-http-client", () => ({
	create: mockCreate
}), { virtual: true });

type MockHttpClient = {
	add: jest.MockedFunction<(
		content: string | Uint8Array | Buffer,
		options?: { pin?: boolean }
	) => Promise<{ cid: { toString(): string }; path: string; size: number }>>;
	cat: jest.MockedFunction<(cid: string) => AsyncIterable<Uint8Array>>;
	pin: {
		add: jest.MockedFunction<(cid: string) => Promise<void>>;
		rm: jest.MockedFunction<(cid: string) => Promise<void>>;
		ls: jest.MockedFunction<(options: { paths: string }) => AsyncIterable<{ cid: { toString(): string } }>>;
	};
	version: jest.MockedFunction<() => Promise<{ version: string }>>;
};

const defaultConfig = {
	host: "127.0.0.1",
	port: 5001,
	protocol: "http" as const,
	timeout: 30_000,
	provider: "kubo" as const,
	apiUrl: "http://127.0.0.1:5001/api/v0",
	gatewayUrl: "http://127.0.0.1:5001/ipfs"
};

function createMockHttpClient(): MockHttpClient {
	return {
		add: jest.fn(),
		cat: jest.fn(),
		pin: {
			add: jest.fn(),
			rm: jest.fn(),
			ls: jest.fn()
		},
		version: jest.fn()
	};
}

function createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
	return {
		async *[Symbol.asyncIterator]() {
			for (const item of items) {
				yield item;
			}
		}
	};
}

describe("IPFSClient", () => {
	let mockHttpClient: MockHttpClient;
	let IPFSClient: typeof import("../client/IPFSClient").IPFSClient;

	beforeEach(async () => {
		jest.resetModules();
		mockHttpClient = createMockHttpClient();
		mockCreate.mockReset();
		mockCreate.mockReturnValue(mockHttpClient);

		const module = await import("../client/IPFSClient");
		IPFSClient = module.IPFSClient;
		mockCreate.mockClear();
	});

	it("creates the client with the provided config", () => {
		const customConfig = {
			...defaultConfig,
			apiUrl: "http://localhost:5001/api/v0",
			gatewayUrl: "http://localhost:5001/ipfs",
			timeout: 45_000
		};

		new IPFSClient(customConfig);

		expect(mockCreate).toHaveBeenCalledWith({
			url: customConfig.apiUrl,
			timeout: customConfig.timeout
		});
	});

	it("adds content and normalizes the CID result", async () => {
		mockHttpClient.add.mockResolvedValue({
			cid: { toString: () => "bafy-test-cid" },
			path: "record.pdf",
			size: 128
		});

		const client = new IPFSClient(defaultConfig);
		const content = Buffer.from("hello world");

		const result = await client.add(content, true);

		expect(mockHttpClient.add).toHaveBeenCalledWith(content, { pin: true });
		expect(result).toEqual({
			cid: "bafy-test-cid",
			path: "record.pdf",
			size: 128
		});
	});

	it("concatenates streamed chunks when downloading content", async () => {
		const chunks = [
			Uint8Array.from([1, 2]),
			Uint8Array.from([3, 4, 5])
		];
		mockHttpClient.cat.mockReturnValue(createAsyncIterable(chunks));

		const client = new IPFSClient(defaultConfig);
		const result = await client.cat("bafy-download-cid");

		expect(mockHttpClient.cat).toHaveBeenCalledWith("bafy-download-cid");
		expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
	});

	it("pins and unpins by delegating to the underlying client", async () => {
		const client = new IPFSClient(defaultConfig);

		await client.pin("bafy-pin-cid");
		await client.unpin("bafy-pin-cid");

		expect(mockHttpClient.pin.add).toHaveBeenCalledWith("bafy-pin-cid");
		expect(mockHttpClient.pin.rm).toHaveBeenCalledWith("bafy-pin-cid");
	});

	it("returns true when a CID is present in the pin listing", async () => {
		mockHttpClient.pin.ls.mockReturnValue(
			createAsyncIterable([
				{ cid: { toString: () => "bafy-pinned-cid" } }
			])
		);

		const client = new IPFSClient(defaultConfig);
		const result = await client.isPinned("bafy-pinned-cid");

		expect(mockHttpClient.pin.ls).toHaveBeenCalledWith({ paths: "bafy-pinned-cid" });
		expect(result).toBe(true);
	});

	it("returns false when a CID is not in the pin listing", async () => {
		mockHttpClient.pin.ls.mockReturnValue(createAsyncIterable([]));

		const client = new IPFSClient(defaultConfig);
		const result = await client.isPinned("bafy-missing-cid");

		expect(result).toBe(false);
	});

	it("reports liveness based on the IPFS version call", async () => {
		mockHttpClient.version.mockResolvedValue({ version: "0.0.1" });

		const client = new IPFSClient(defaultConfig);

		expect(await client.ping()).toBe(true);
	});

	it("returns false when the version call fails", async () => {
		mockHttpClient.version.mockRejectedValue(new Error("network down"));

		const client = new IPFSClient(defaultConfig);

		expect(await client.ping()).toBe(false);
	});

	it("builds a gateway URL from the configured gateway base", () => {
		const client = new IPFSClient(defaultConfig);

		expect(client.getGatewayUrl("bafy-url-cid")).toBe(
			"http://127.0.0.1:5001/ipfs/bafy-url-cid"
		);
	});
});