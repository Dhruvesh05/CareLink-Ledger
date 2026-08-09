import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../client/IPFSClient", () => ({
    ipfsClient: {}
}));

type MockStorage = {
    store: jest.MockedFunction<(input: any) => Promise<any>>;
};

function createMockStorage(): MockStorage {
    return {
        store: jest.fn()
    } as unknown as MockStorage;
}

describe("IPFSServiceAdapter", () => {
    let IPFSServiceAdapter: typeof import("../adapters/IPFSServiceAdapter").IPFSServiceAdapter;
    let mockStorage: MockStorage;

    beforeEach(async () => {
        jest.resetModules();
        mockStorage = createMockStorage();
        const module = await import("../adapters/IPFSServiceAdapter");
        IPFSServiceAdapter = module.IPFSServiceAdapter;
    });

    it("forwards buffer, filename and mimetype to StorageService and returns cid", async () => {
        const fakeUpload = {
            cid: "bafy-adapter-cid",
            path: "file.pdf",
            size: 1024,
            gatewayUrl: "http://gateway/ipfs/bafy-adapter-cid"
        };

        const fakeMetadata = {
            cid: "bafy-adapter-cid",
            fileName: "file.pdf",
            mimeType: "application/pdf",
            fileSize: 1024,
            uploadedAt: new Date().toISOString()
        };

        mockStorage.store.mockResolvedValue({ upload: fakeUpload, metadata: fakeMetadata });

        const adapter = new IPFSServiceAdapter(mockStorage as any);

        const buffer = Buffer.from("hello world");

        const result = await adapter.uploadFile(buffer, "file.pdf", "application/pdf");

        expect(mockStorage.store).toHaveBeenCalled();
        const calledWith = mockStorage.store.mock.calls[0][0];
        expect(calledWith.content).toBe(buffer);
        expect(calledWith.fileName).toBe("file.pdf");
        expect(calledWith.mimeType).toBe("application/pdf");

        expect(result.cid).toBe("bafy-adapter-cid");
        expect(result.size).toBe(1024);
        expect(result.fileName).toBe("file.pdf");
        expect(result.mimeType).toBe("application/pdf");
    });

    it("propagates storage errors", async () => {
        const underlying = new Error("storage failure");
        mockStorage.store.mockRejectedValue(underlying);

        const adapter = new IPFSServiceAdapter(mockStorage as any);

        await expect(adapter.uploadFile(Buffer.from("x"), "x.txt", "text/plain")).rejects.toBe(underlying);
    });

});
