import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockCreateAgent: any = jest.fn();

jest.mock("../agent/createAgent", () => ({
    createAgent: mockCreateAgent,
}));

import DidService from "../services/DidService";

describe("DidService", () => {
    const mockAgent: any = {
        didManagerCreate: jest.fn() as any,
        resolveDid: jest.fn() as any,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAgent.mockResolvedValue(mockAgent);
    });

    it("createDid success", async () => {
        const did = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        mockAgent.didManagerCreate.mockResolvedValue({ did });

        const result = await DidService.createDid();

        expect(result).toBe(did);
        expect(mockCreateAgent).toHaveBeenCalledTimes(1);
        expect(mockAgent.didManagerCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: "did:key",
                alias: expect.any(String),
            }),
        );
    });

    it("resolveDid success", async () => {
        const did = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const resolved = { didDocument: { id: did, "@context": "https://w3id.org/did/v1" } };
        mockAgent.resolveDid.mockResolvedValue(resolved);

        const result = await DidService.resolveDid(did);

        expect(result).toEqual(resolved);
        expect(mockAgent.resolveDid).toHaveBeenCalledWith({ didUrl: did });
    });

    it("resolveDid invalid/error case", async () => {
        await expect(DidService.resolveDid(" ")).rejects.toThrow("DID is required");

        const did = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        mockAgent.resolveDid.mockRejectedValue(new Error("not found"));

        await expect(DidService.resolveDid(did)).rejects.toThrow(
            `Failed to resolve DID "${did}": not found`,
        );
    });

    it("forwards provider did:key to Veramo", async () => {
        const did = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        mockAgent.didManagerCreate.mockResolvedValue({ did });

        await DidService.createDid();

        expect(mockAgent.didManagerCreate).toHaveBeenCalledWith(
            expect.objectContaining({ provider: "did:key" }),
        );
    });
});
