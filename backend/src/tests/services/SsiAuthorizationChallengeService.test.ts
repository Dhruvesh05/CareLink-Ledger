import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type ChallengeRecord = {
    _id?: string;
    challenge: string;
    expiresAt: Date;
};

const mockCreate = jest.fn() as jest.MockedFunction<
    (document: Record<string, unknown>) => Promise<ChallengeRecord>
>;
const mockSort = jest.fn() as jest.MockedFunction<
    (sort: Record<string, number>) => Promise<ChallengeRecord | null>
>;
const mockFindOne = jest.fn() as jest.MockedFunction<
    (filter: Record<string, unknown>) => { sort: typeof mockSort }
>;
const mockFindOneAndUpdate = jest.fn() as jest.MockedFunction<
    (
        filter: Record<string, unknown>,
        update: Record<string, unknown>,
        options: Record<string, unknown>
    ) => Promise<ChallengeRecord | null>
>;

jest.unstable_mockModule("../../models/SsiAuthorizationChallenge", () => ({
    __esModule: true,
    default: {
        create: (...args: [Record<string, unknown>]) => mockCreate(...args),
        findOne: (...args: [Record<string, unknown>]) => mockFindOne(...args),
        findOneAndUpdate: (
            ...args: [
                Record<string, unknown>,
                Record<string, unknown>,
                Record<string, unknown>
            ]
        ) => mockFindOneAndUpdate(...args),
    },
}));

const {
    SsiAuthorizationChallengeService,
    SSI_AUTHORIZATION_CHALLENGE_TTL_MS,
} = await import("../../services/SsiAuthorizationChallengeService");

describe("SsiAuthorizationChallengeService", () => {
    const service = new SsiAuthorizationChallengeService();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFindOne.mockReturnValue({ sort: mockSort });
        mockSort.mockResolvedValue(null);
    });

    it("generates and persists a cryptographically random challenge", async () => {
        const expiresAt = new Date(Date.now() + SSI_AUTHORIZATION_CHALLENGE_TTL_MS);
        mockCreate.mockResolvedValue({
            _id: "challenge-created",
            challenge: "stored-challenge",
            expiresAt,
        });

        const result = await service.createChallenge("user-1");

        expect(result.challenge).toMatch(/^[a-f0-9]{64}$/);
        expect(result.challengeId).toBe("challenge-created");
        expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
        expect(result.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
            SSI_AUTHORIZATION_CHALLENGE_TTL_MS
        );
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            challenge: result.challenge,
            expiresAt: result.expiresAt,
            used: false,
        }));
    });

    it("loads only the latest unexpired challenge for the user", async () => {
        const record = {
                _id: "challenge-id",
                challenge: "pending-challenge",
            expiresAt: new Date(Date.now() + 60_000),
        };
        mockSort.mockResolvedValue(record);

        await expect(service.getPendingChallenge("user-1")).resolves.toEqual({
            challengeId: "challenge-id",
            challenge: record.challenge,
            expiresAt: record.expiresAt
        });

        expect(mockFindOne).toHaveBeenCalledWith({
            userId: "user-1",
            used: false,
            expiresAt: { $gt: expect.any(Date) },
        });
        expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("retrieves and consumes the exact challenge ID for the user", async () => {
        mockFindOne.mockReturnValue({
            sort: mockSort
        });
        mockFindOne.mockResolvedValue({
            _id: "challenge-a",
            challenge: "nonce-a",
            expiresAt: new Date(Date.now() + 60_000)
        } as never);

        await expect(service.getChallenge("user-1", "challenge-a")).resolves.toEqual(
            expect.objectContaining({
                challengeId: "challenge-a",
                challenge: "nonce-a"
            })
        );
        expect(mockFindOne).toHaveBeenCalledWith({
            _id: "challenge-a",
            userId: "user-1",
            used: false,
            expiresAt: { $gt: expect.any(Date) }
        });

        mockFindOneAndUpdate.mockResolvedValue({
            _id: "challenge-a",
            challenge: "nonce-a",
            expiresAt: new Date(Date.now() + 60_000)
        });
        await expect(service.consumeChallenge("user-1", "challenge-a")).resolves.toBe(true);
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            {
                userId: "user-1",
                _id: "challenge-a",
                used: false,
                expiresAt: { $gt: expect.any(Date) }
            },
            { $set: { used: true } },
            { new: true }
        );
    });

    it("rejects missing or expired pending challenges", async () => {
        await expect(service.getPendingChallenge("user-1")).resolves.toBeNull();
        expect(mockFindOne).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            used: false,
        }));
    });

    it("consumes a matching challenge atomically", async () => {
        mockFindOneAndUpdate.mockResolvedValue({
            _id: "challenge-a",
            expiresAt: new Date(Date.now() + 60_000),
        });

        await expect(
            service.consumeChallenge("user-1", "challenge-a")
        ).resolves.toBe(true);

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            {
                userId: "user-1",
                _id: "challenge-a",
                used: false,
                expiresAt: { $gt: expect.any(Date) },
            },
            { $set: { used: true } },
            { new: true }
        );
    });

    it("rejects second, expired, wrong-user, and wrong-challenge consumption", async () => {
        mockFindOneAndUpdate.mockResolvedValue(null);

        await expect(service.consumeChallenge("user-1", "challenge-a"))
            .resolves.toBe(false);
        await expect(service.consumeChallenge("user-2", "challenge-a"))
            .resolves.toBe(false);
        await expect(service.consumeChallenge("user-1", "challenge-b"))
            .resolves.toBe(false);
        await expect(service.consumeChallenge("user-1", "expired-challenge"))
            .resolves.toBe(false);

        expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(4);
    });

    it("requires an authenticated user for challenge creation and lookup", async () => {
        await expect(service.createChallenge("")).rejects.toThrow(
            "Authenticated user is required"
        );
        await expect(service.getPendingChallenge("")).rejects.toThrow(
            "Authenticated user is required"
        );
        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockFindOne).not.toHaveBeenCalled();
    });
});