import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { IVerifyResult } from "@veramo/core-types";
import type { CareLinkAuthorizedIdentity } from "../interfaces/ICareLinkAuthorizationService";

const mockVerifyPresentation = jest.fn() as jest.MockedFunction<
    (...args: any[]) => Promise<IVerifyResult>
>;
const mockAuthorizeVerifiedPresentation = jest.fn() as jest.MockedFunction<
    (...args: any[]) => Promise<CareLinkAuthorizedIdentity>
>;
const mockGetPendingChallenge = jest.fn() as jest.MockedFunction<
    (userId: string) => Promise<{ challenge: string; expiresAt: Date } | null>
>;
const mockConsumeChallenge = jest.fn() as jest.MockedFunction<
    (userId: string, challenge: string) => Promise<boolean>
>;

jest.mock("../services/PresentationService", () => ({
    __esModule: true,
    default: {
        verifyPresentation: mockVerifyPresentation,
    },
}));

jest.mock("../services/CareLinkAuthorizationService", () => ({
    __esModule: true,
    default: {
        authorizeVerifiedPresentation: mockAuthorizeVerifiedPresentation,
    },
}));

jest.mock("../../services/SsiAuthorizationChallengeService", () => ({
    __esModule: true,
    default: {
        getPendingChallenge: (...args: [string]) => mockGetPendingChallenge(...args),
        consumeChallenge: (...args: [string, string]) => mockConsumeChallenge(...args),
    },
}));

import { requireCareLinkRole } from "../middleware/carelinkAuthorization";

function createResponseMock() {
    const response: any = {};
    response.status = jest.fn().mockReturnValue(response);
    response.json = jest.fn().mockReturnValue(response);
    return response;
}

describe("requireCareLinkRole", () => {
    const authenticatedUser = {
        userId: "user-1",
        walletAddress: "0x1234567890123456789012345678901234567890",
        role: "Doctor" as const,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetPendingChallenge.mockResolvedValue({
            challenge: "server-challenge",
            expiresAt: new Date(Date.now() + 60_000),
        });
        mockConsumeChallenge.mockResolvedValue(true);
    });

    it("allows a verified identity with the required role", async () => {
        const next = jest.fn();
        const response = createResponseMock();
        const identity: CareLinkAuthorizedIdentity = {
            userId: "user-1",
            did: "did:key:doctor",
            role: "Doctor",
        };

        mockVerifyPresentation.mockResolvedValue({ verified: true });
        mockAuthorizeVerifiedPresentation.mockResolvedValue(identity);

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: {
                    presentation: { holder: identity.did },
                },
            } as any,
            response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(mockVerifyPresentation).toHaveBeenCalledWith(
            { holder: identity.did },
            "server-challenge"
        );
        expect(mockConsumeChallenge).toHaveBeenCalledWith(
            authenticatedUser.userId,
            "server-challenge"
        );
    });

    it("rejects a verified Patient identity for a required Doctor role", async () => {
        const next = jest.fn();
        const response = createResponseMock();

        mockVerifyPresentation.mockResolvedValue({ verified: true });
        mockAuthorizeVerifiedPresentation.mockResolvedValue({
            userId: "user-1",
            did: "did:key:patient",
            role: "Patient",
        });

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: {
                    presentation: { holder: "did:key:patient" },
                },
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("does not authorize when VP verification fails", async () => {
        const next = jest.fn();
        const response = createResponseMock();

        mockVerifyPresentation.mockResolvedValue({ verified: false });

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: {
                    presentation: { holder: "did:key:doctor" },
                },
            } as any,
            response,
            next
        );

        expect(mockAuthorizeVerifiedPresentation).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("does not trust a client-provided challenge", async () => {
        mockVerifyPresentation.mockResolvedValue({ verified: true });
        mockAuthorizeVerifiedPresentation.mockResolvedValue({
            userId: authenticatedUser.userId,
            did: "did:key:doctor",
            role: "Doctor",
        });

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: {
                    presentation: { holder: "did:key:doctor" },
                    challenge: "client-controlled-challenge",
                },
            } as any,
            createResponseMock(),
            jest.fn()
        );

        expect(mockVerifyPresentation).toHaveBeenCalledWith(
            { holder: "did:key:doctor" },
            "server-challenge"
        );
    });

    it("rejects a presentation supplied only through query parameters", async () => {
        const next = jest.fn();
        const response = createResponseMock();

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                query: {
                    presentation: { holder: "did:key:doctor" },
                },
                body: {},
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockVerifyPresentation).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects missing authentication or a missing pending challenge", async () => {
        const response = createResponseMock();
        const next = jest.fn();

        await requireCareLinkRole("Doctor")(
            { body: { presentation: {} } } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();

        jest.clearAllMocks();
        mockGetPendingChallenge.mockResolvedValue(null);

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: { presentation: {} },
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockVerifyPresentation).not.toHaveBeenCalled();
    });

    it("rejects verification failure and an SSI identity for another user", async () => {
        const response = createResponseMock();
        const next = jest.fn();
        mockVerifyPresentation.mockResolvedValue({ verified: false });

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: { presentation: {} },
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockAuthorizeVerifiedPresentation).not.toHaveBeenCalled();

        jest.clearAllMocks();
        mockGetPendingChallenge.mockResolvedValue({
            challenge: "server-challenge",
            expiresAt: new Date(Date.now() + 60_000),
        });
        mockVerifyPresentation.mockResolvedValue({ verified: true });
        mockAuthorizeVerifiedPresentation.mockResolvedValue({
            userId: "different-user",
            did: "did:key:doctor",
            role: "Doctor",
        });

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: { presentation: {} },
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(mockConsumeChallenge).not.toHaveBeenCalled();
    });

    it("rejects an already-consumed challenge", async () => {
        const response = createResponseMock();
        const next = jest.fn();
        mockVerifyPresentation.mockResolvedValue({ verified: true });
        mockAuthorizeVerifiedPresentation.mockResolvedValue({
            userId: authenticatedUser.userId,
            did: "did:key:doctor",
            role: "Doctor",
        });
        mockConsumeChallenge.mockResolvedValue(false);

        await requireCareLinkRole("Doctor")(
            {
                auth: authenticatedUser,
                body: { presentation: {} },
            } as any,
            response,
            next
        );

        expect(response.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});