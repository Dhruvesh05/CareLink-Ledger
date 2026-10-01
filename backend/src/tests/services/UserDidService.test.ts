import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type TestUser = {
    _id: { toString: () => string };
    did?: string;
};

const firstUser: TestUser = {
    _id: { toString: () => "user-1" },
};

const mockFindById = jest.fn<
    (userId: string) => Promise<typeof firstUser | null>
>();

const mockFindOneAndUpdate = jest.fn<
    (
        filter: Record<string, unknown>,
        update: Record<string, unknown>,
        options: Record<string, unknown>
    ) => Promise<typeof firstUser | null>
>();

const mockCreateIdentity = jest.fn<
    (alias?: string) => Promise<{ did: string }>
>();

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findById: mockFindById,
        findOneAndUpdate: mockFindOneAndUpdate
    }
}));

jest.mock("../../ssi/services/IdentityService", () => ({
    __esModule: true,
    default: {
        createIdentity: mockCreateIdentity
    }
}));

import { UserDidService } from "../../services/UserDidService";

describe("UserDidService", () => {
    const service = new UserDidService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates, persists, and returns a DID for the authenticated user", async () => {
        const did = "did:key:first-user";
        mockFindById
            .mockResolvedValueOnce(firstUser)
            .mockResolvedValueOnce({ ...firstUser, did });
        mockCreateIdentity.mockResolvedValue({ did });
        mockFindOneAndUpdate.mockResolvedValue({ ...firstUser, did });

        await expect(service.createOrLoadDid("user-1")).resolves.toBe(did);
        await expect(service.createOrLoadDid("user-1")).resolves.toBe(did);

        expect(mockCreateIdentity).toHaveBeenCalledWith("carelink-user-user-1");
        expect(mockCreateIdentity).toHaveBeenCalledTimes(1);
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ _id: firstUser._id }),
            { $set: { did } },
            { new: true }
        );
    });

    it("loads an existing DID rather than recreating it", async () => {
        const did = "did:key:existing";
        mockFindById.mockResolvedValue({ ...firstUser, did });

        await expect(service.createOrLoadDid("user-1")).resolves.toBe(did);
        await expect(service.getDid("user-1")).resolves.toBe(did);

        expect(mockCreateIdentity).not.toHaveBeenCalled();
        expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it("only returns the DID belonging to the requested user", async () => {
        const firstDid = "did:key:first-user";
        mockFindById.mockResolvedValueOnce({ ...firstUser, did: firstDid });

        await expect(service.getDid("user-1")).resolves.toBe(firstDid);

        mockFindById.mockResolvedValueOnce({
            _id: { toString: () => "user-2" },
            did: undefined
        });

        await expect(service.getDid("user-2")).rejects.toThrow(
            "Authenticated user does not have a DID"
        );
    });

    it("reports authentication and user lookup failures", async () => {
        await expect(service.getDid("")).rejects.toThrow(
            "Authenticated user is required"
        );

        mockFindById.mockResolvedValue(null);
        await expect(service.getDid("missing-user")).rejects.toThrow(
            "Authenticated user not found"
        );
    });
});