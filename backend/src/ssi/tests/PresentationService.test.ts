import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type PresentationResult = Record<string, unknown>;

const mockCreateAgent = jest.fn() as jest.MockedFunction<
    () => Promise<{
        createVerifiablePresentation: jest.MockedFunction<
            (args: Record<string, unknown>) => Promise<PresentationResult>
        >;
        verifyPresentation: jest.MockedFunction<
            (args: Record<string, unknown>) => Promise<{
                verified: boolean;
                error?: { message: string; errorCode?: string };
            }>
        >;
    }>
>;

const mockAgent = {
    createVerifiablePresentation: jest.fn() as jest.MockedFunction<
        (args: Record<string, unknown>) => Promise<PresentationResult>
    >,
    verifyPresentation: jest.fn() as jest.MockedFunction<
        (args: Record<string, unknown>) => Promise<{
            verified: boolean;
            error?: { message: string; errorCode?: string };
        }>
    >,
};

jest.mock("../agent/createAgent", () => ({
    createAgent: mockCreateAgent,
}));

import PresentationService from "../services/PresentationService";

const holderDid = "did:key:holder";
const challengeA = "challenge-a";
const challengeB = "challenge-b";
const credential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "CareLinkRoleCredential"],
    issuer: "did:key:issuer",
    credentialSubject: { id: holderDid, role: "Doctor" },
    proof: { type: "JwtProof2020", jwt: "signed-credential" },
};
const presentation = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiablePresentation"],
    holder: holderDid,
    verifiableCredential: [credential],
    proof: { type: "JwtProof2020", jwt: "signed-presentation" },
};

describe("PresentationService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAgent.mockResolvedValue(mockAgent);
        mockAgent.createVerifiablePresentation.mockResolvedValue(presentation);
        mockAgent.verifyPresentation.mockResolvedValue({ verified: true });
    });

    it("creates a VP with the existing credential and supplied challenge", async () => {
        await PresentationService.createPresentation(
            holderDid,
            [credential] as any,
            challengeA,
            "carelink.example",
        );

        expect(mockAgent.createVerifiablePresentation).toHaveBeenCalledWith({
            presentation: expect.objectContaining({
                holder: holderDid,
                verifiableCredential: [credential],
            }),
            proofFormat: "jwt",
            challenge: challengeA,
            domain: "carelink.example",
        });
    });

    it("verifies a VP with the expected challenge", async () => {
        await expect(
            PresentationService.verifyPresentation(presentation as any, challengeA),
        ).resolves.toEqual({ verified: true });

        expect(mockAgent.verifyPresentation).toHaveBeenCalledWith({
            presentation,
            challenge: challengeA,
        });
    });

    it("returns failure for a tampered VP", async () => {
        mockAgent.verifyPresentation.mockResolvedValue({
            verified: false,
            error: { message: "Invalid presentation proof" },
        });

        await expect(
            PresentationService.verifyPresentation(presentation as any, challengeA),
        ).resolves.toEqual(expect.objectContaining({ verified: false }));
    });

    it("returns failure for an invalid embedded credential", async () => {
        const invalidPresentation = {
            ...presentation,
            verifiableCredential: [{ ...credential, proof: undefined }],
        };

        await expect(
            PresentationService.verifyPresentation(invalidPresentation as any, challengeA),
        ).resolves.toEqual(expect.objectContaining({ verified: false }));
        expect(mockAgent.verifyPresentation).not.toHaveBeenCalled();
    });

    it("rejects missing challenges during creation and verification", async () => {
        await expect(
            PresentationService.createPresentation(holderDid, [credential] as any, ""),
        ).rejects.toThrow("Challenge is required");

        await expect(
            PresentationService.verifyPresentation(presentation as any, " "),
        ).resolves.toEqual(expect.objectContaining({ verified: false }));
    });

    it("fails verification when the expected challenge does not match", async () => {
        mockAgent.verifyPresentation.mockResolvedValue({
            verified: false,
            error: { message: "Challenge mismatch" },
        });

        await expect(
            PresentationService.verifyPresentation(presentation as any, challengeB),
        ).resolves.toEqual(expect.objectContaining({ verified: false }));
        expect(mockAgent.verifyPresentation).toHaveBeenCalledWith({
            presentation,
            challenge: challengeB,
        });
    });

    it("rejects a replay-style verification with a different challenge", async () => {
        await PresentationService.createPresentation(
            holderDid,
            [credential] as any,
            challengeA,
        );
        mockAgent.verifyPresentation.mockResolvedValue({ verified: false });

        await expect(
            PresentationService.verifyPresentation(presentation as any, challengeB),
        ).resolves.toEqual({ verified: false });
    });

    it("rejects a malformed holder DID", async () => {
        await expect(
            PresentationService.createPresentation("holder", [credential] as any, challengeA),
        ).rejects.toThrow("Holder DID is required");
    });
});