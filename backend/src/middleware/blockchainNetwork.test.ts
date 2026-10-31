import { describe, expect, it, jest } from "@jest/globals";
import type { Request, Response } from "express";
import { resolveBlockchainNetwork } from "./blockchainNetwork";

function makeResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
}

describe("resolveBlockchainNetwork", () => {
    it.each([
        { header: "11155111", chainId: 11155111, provider: "ethereum" },
        { header: "80002", chainId: 80002, provider: "polygon" },
    ])("attaches the supported network for chain ID $chainId", ({ header, chainId, provider }) => {
        const req = { get: jest.fn().mockReturnValue(header) } as unknown as Request;
        const res = makeResponse();
        const next = jest.fn();

        resolveBlockchainNetwork(req, res, next);

        expect(req.careLinkNetwork?.chainId).toBe(chainId);
        expect(req.careLinkNetwork?.provider).toBe(provider);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("rejects a mainnet or unknown chain ID", () => {
        const req = { get: jest.fn().mockReturnValue("1") } as unknown as Request;
        const res = makeResponse();
        const next = jest.fn();

        resolveBlockchainNetwork(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(next).not.toHaveBeenCalled();
    });
});
