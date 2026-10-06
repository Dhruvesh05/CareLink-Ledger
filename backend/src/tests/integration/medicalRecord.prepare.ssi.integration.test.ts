import express from "express";
import type { Server } from "node:http";
import type {
    IVerifyResult,
    VerifiablePresentation,
    W3CVerifiableCredential,
    W3CVerifiablePresentation,
} from "@veramo/core-types";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";

import type {
    PrepareMedicalRecordInput,
    PreparedMedicalRecordTransaction,
} from "../../services/blockchain/MedicalRecordTransactionPreparationService";

process.env.JWT_SECRET = "medical-record-ssi-integration-jwt-secret";
process.env.SSI_SECRET_KEY = "11".repeat(32);
process.env.SSI_DATABASE = ":memory:";

type TestUser = {
    _id: { toString: () => string };
    did: string;
    role: "Doctor" | "Patient";
};

type ChallengeRecord = {
    userId: string;
    challenge: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
};

type ChallengeLookup = {
    userId: string;
    used: boolean;
    expiresAt: { $gt: Date };
};

type ChallengeConsumption = {
    userId: string;
    challenge: string;
    used: boolean;
    expiresAt: { $gt: Date };
};

type VerifyPresentation = (
    presentation: W3CVerifiablePresentation,
    challenge: string,
    domain?: string,
) => Promise<IVerifyResult>;

const mockPrepare = jest.fn<
    (input: PrepareMedicalRecordInput) => Promise<PreparedMedicalRecordTransaction>
>();
const mockUserFindOne = jest.fn<
    (filter: { did: string }) => Promise<TestUser | null>
>();
const mockUserFindById = jest.fn<
    (userId: string) => Promise<TestUser | null>
>();
const mockChallengeCreate = jest.fn<
    (document: Omit<ChallengeRecord, "createdAt">) => Promise<ChallengeRecord>
>();
const mockChallengeFindOne = jest.fn<
    (filter: ChallengeLookup) => {
        sort: () => Promise<ChallengeRecord | null>;
    }
>();
const mockChallengeFindOneAndUpdate = jest.fn<
    (
        filter: ChallengeConsumption,
        update: Record<string, unknown>,
        options: Record<string, unknown>,
    ) => Promise<ChallengeRecord | null>
>();
const challengeRecords: ChallengeRecord[] = [];
const users = new Map<string, TestUser>();

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findOne: (...args: Parameters<typeof mockUserFindOne>) => mockUserFindOne(...args),
        findById: (...args: Parameters<typeof mockUserFindById>) => mockUserFindById(...args),
    },
}));

jest.mock("../../models/SsiAuthorizationChallenge", () => ({
    __esModule: true,
    default: {
        create: (...args: Parameters<typeof mockChallengeCreate>) => mockChallengeCreate(...args),
        findOne: (...args: Parameters<typeof mockChallengeFindOne>) => mockChallengeFindOne(...args),
        findOneAndUpdate: (...args: Parameters<typeof mockChallengeFindOneAndUpdate>) => mockChallengeFindOneAndUpdate(...args),
    },
}));

jest.mock("../../services/blockchain/MedicalRecordTransactionPreparationService", () => ({
    MedicalRecordTransactionPreparationService: jest.fn().mockImplementation(() => ({
        prepare: mockPrepare,
    })),
}));

jest.mock("../../services/blockchain/MedicalRecordTransactionConfirmationService", () => ({
    MedicalRecordTransactionConfirmationService: jest.fn().mockImplementation(() => ({
        confirm: jest.fn(),
    })),
}));

jest.mock("../../blockchain/provider/BlockchainFactory", () => ({
    BlockchainFactory: {
        getProvider: jest.fn(() => ({})),
    },
}));

const DOCTOR_WALLET = "0x1111111111111111111111111111111111111111";
const PATIENT_WALLET = "0x2222222222222222222222222222222222222222";

let app: express.Express;
let server: Server;
let baseUrl: string;
let createIdentity: (alias?: string) => Promise<{ did: string }>;
let issueRoleCredential: (input: {
    issuerDid: string;
    subjectDid: string;
    userId: string;
}) => Promise<W3CVerifiableCredential>;
let createPresentation: (
    holderDid: string,
    credentials: W3CVerifiableCredential[],
    challenge: string,
) => Promise<VerifiablePresentation>;
let createChallenge: (userId: string) => Promise<{
    challenge: string;
    expiresAt: Date;
}>;
let generateToken: (payload: {
    userId: string;
    walletAddress: string;
    role: "Doctor" | "Patient";
}) => string;
let issuerDid: string;
let presentationService: {
    verifyPresentation: VerifyPresentation;
};
let presentationVerificationSpy:
    | jest.MockedFunction<VerifyPresentation>
    | undefined;
let scenarioNumber = 0;
let beforeAllStep = "not started";

function getRecordForUser(userId: string) {
    return challengeRecords
        .filter((record) => record.userId === userId && !record.used && record.expiresAt > new Date())
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
}

function getStoredRecordForUser(userId: string) {
    return challengeRecords
        .filter((record) => record.userId === userId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
}

function createUser(userId: string, did: string, role: "Doctor" | "Patient"): TestUser {
    const user: TestUser = {
        _id: {
            toString: () => userId,
        },
        did,
        role,
    };

    users.set(userId, user);
    return user;
}

async function createScenario(role: "Doctor" | "Patient") {
    scenarioNumber += 1;
    const userId = `${role.toLowerCase()}-integration-user-${scenarioNumber}`;
    const identity = await createIdentity(`medical-record-${userId}`);
    createUser(userId, identity.did, role);

    const credential = await issueRoleCredential({
        issuerDid,
        subjectDid: identity.did,
        userId,
    });
    const pendingChallenge = await createChallenge(userId);
    const token = generateToken({
        userId,
        walletAddress: DOCTOR_WALLET,
        role,
    });

    return {
        userId,
        identity,
        credential,
        pendingChallenge,
        token,
    };
}

async function sendPrepare(
    token: string,
    presentation?: unknown,
    includeFile = true,
) {
    const form = new FormData();

    if (includeFile) {
        form.append(
            "file",
            new Blob([Buffer.from("medical-record-content")], {
                type: "application/pdf",
            }),
            "record.pdf",
        );
    }

    if (presentation !== undefined) {
        form.append("presentation", JSON.stringify(presentation));
    }

    form.append("patient", PATIENT_WALLET);
    form.append("category", "general");
    form.append("emergency", "false");

    const response = await fetch(`${baseUrl}/prepare`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: form,
    });

    return {
        response,
        body: await response.json(),
    };
}

describe("medical record prepare SSI multipart integration", () => {
    beforeAll(async () => {
        try {
            beforeAllStep = "loading integration dependencies";
            const [{ default: IdentityService }, { default: CareLinkCredentialService }, { default: PresentationService }, { default: SsiAuthorizationChallengeService }, { generateToken: tokenGenerator }, { createAgent }, { env }, { default: medicalRecordRoutes }] = await Promise.all([
                import("../../ssi/services/IdentityService"),
                import("../../ssi/services/CareLinkCredentialService"),
                import("../../ssi/services/PresentationService"),
                import("../../services/SsiAuthorizationChallengeService"),
                import("../../utils/jwt"),
                import("../../ssi/agent/createAgent"),
                import("../../config/env"),
                import("../../routes/medicalRecord.routes"),
            ]);

            beforeAllStep = "creating Veramo agent";
            const agent = null === createAgent ? await import("../../ssi/agent/createAgent").then((mod) => mod.createAgent()) : await createAgent();

            beforeAllStep = "creating issuer DID";
            const issuer = await agent.didManagerCreate({
                provider: "did:key",
                alias: "medical-record-integration-issuer",
            });
            issuerDid = issuer.did;
            env.CARELINK_ISSUER_DID = issuerDid;

            beforeAllStep = "binding SSI services";
            createIdentity = IdentityService.createIdentity.bind(IdentityService);
            issueRoleCredential = CareLinkCredentialService.issueRoleCredential.bind(
                CareLinkCredentialService,
            ) as typeof issueRoleCredential;
            createPresentation = PresentationService.createPresentation.bind(PresentationService);
            createChallenge = SsiAuthorizationChallengeService.createChallenge.bind(SsiAuthorizationChallengeService);
            generateToken = tokenGenerator;
            presentationService = PresentationService;

            beforeAllStep = "mounting medical-record route";
            app = express();
            app.use(medicalRecordRoutes);

            beforeAllStep = "starting integration server";
            server = await new Promise<Server>((resolve) => {
                const listeningServer = app.listen(0, () => resolve(listeningServer));
            });
            const address = server.address();
            if (!address || typeof address === "string") {
                throw new Error("Integration test server did not expose a port.");
            }
            baseUrl = `http://127.0.0.1:${address.port}/prepare`;

            beforeAllStep = "installing model mocks";
            mockUserFindOne.mockImplementation(async ({ did }) => {
                return [...users.values()].find((user) => user.did === did) ?? null;
            });
            mockUserFindById.mockImplementation(async (userId) => users.get(String(userId)) ?? null);
            mockChallengeCreate.mockImplementation(async (document) => {
                const record = {
                    ...document,
                    createdAt: new Date(),
                };
                challengeRecords.push(record);
                return record;
            });
            mockChallengeFindOne.mockImplementation((filter) => ({
                sort: async () => getRecordForUser(filter.userId),
            }));
            mockChallengeFindOneAndUpdate.mockImplementation(async (filter) => {
                const record = challengeRecords.find(
                    (candidate) =>
                        candidate.userId === filter.userId &&
                        candidate.challenge === filter.challenge &&
                        !candidate.used &&
                        candidate.expiresAt > new Date(),
                );
                if (!record) {
                    return null;
                }
                record.used = true;
                return record;
            });
        } catch (error) {
            const details = error instanceof Error
                ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
                : String(error);
            throw new Error(
                `SSI multipart integration setup failed during ${beforeAllStep}.\n${details}`,
            );
        }
    });

    beforeEach(() => {
        challengeRecords.length = 0;
        users.clear();
        mockPrepare.mockReset();
        mockPrepare.mockResolvedValue({
            preparationId: "preparation-1",
            transaction: {
                to: DOCTOR_WALLET,
                data: "0x",
                chainId: 1,
                value: "0",
            },
            doctorWallet: DOCTOR_WALLET,
            hospitalWallet: "0x3333333333333333333333333333333333333333",
            patientWallet: PATIENT_WALLET,
            cid: "bafy-medical-record",
            fileHash: "a".repeat(64),
            fileName: "record.pdf",
            mimeType: "application/pdf",
            fileSize: 21,
            category: "general",
            emergency: false,
        });
        if (!presentationService) {
            throw new Error(
                `SSI multipart integration setup did not complete; last step: ${beforeAllStep}`,
            );
        }
        if (!presentationVerificationSpy) {
            presentationVerificationSpy = jest.spyOn(
                presentationService,
                "verifyPresentation",
            ) as unknown as jest.MockedFunction<VerifyPresentation>;
        } else {
            presentationVerificationSpy.mockClear();
        }
    });

    afterAll(async () => {
    presentationVerificationSpy?.mockRestore();

    if (server) {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

    it("accepts a real SSI-authorized multipart Doctor request", async () => {
        const scenario = await createScenario("Doctor");
        const presentation = await createPresentation(
            scenario.identity.did, 
            [scenario.credential],
            scenario.pendingChallenge.challenge,
        );

        const result = await sendPrepare(scenario.token, presentation);
        const preparationInput = mockPrepare.mock.calls[0][0];

        expect(result.response.status).toBe(200);
        expect(result.body).toEqual(expect.objectContaining({ success: true }));
        expect(presentationVerificationSpy).toBeDefined();
        const verificationSpy = presentationVerificationSpy!;
        const verificationCall = verificationSpy.mock.calls.find(
            ([, challenge]) => challenge === scenario.pendingChallenge.challenge,
        );
        expect(verificationCall?.[0]).toEqual(
            expect.objectContaining({ holder: scenario.identity.did }),
        );
        expect(verificationCall?.[1]).toBe(scenario.pendingChallenge.challenge);
        expect(mockPrepare).toHaveBeenCalledTimes(1);
        expect(preparationInput).toEqual(expect.objectContaining({
            doctorWallet: DOCTOR_WALLET,
            patientWallet: PATIENT_WALLET,
            category: "general",
            emergency: false,
        }));
        expect(preparationInput.file.buffer).toEqual(Buffer.from("medical-record-content"));
        expect(getStoredRecordForUser(scenario.userId).used).toBe(true);
    });

    it("rejects a VP created with the wrong challenge without consuming the valid challenge", async () => {
        const scenario = await createScenario("Doctor");
        const presentation = await createPresentation(
            scenario.identity.did,
            [scenario.credential],
            "wrong-challenge",
        );

        const result = await sendPrepare(scenario.token, presentation);

        expect(result.response.status).toBe(403);
        expect(result.body.message).toBe("Verifiable presentation is invalid");
        expect(mockPrepare).not.toHaveBeenCalled();
        expect(getStoredRecordForUser(scenario.userId).used).toBe(false);
    });

    it("rejects a valid non-Doctor CareLink presentation before the controller", async () => {
        const scenario = await createScenario("Patient");
        const presentation = await createPresentation(
            scenario.identity.did,
            [scenario.credential],
            scenario.pendingChallenge.challenge,
        );

        const result = await sendPrepare(scenario.token, presentation);

        expect(result.response.status).toBe(403);
        expect(result.body.message).toBe("Insufficient CareLink role");
        expect(mockPrepare).not.toHaveBeenCalled();
        expect(getStoredRecordForUser(scenario.userId).used).toBe(false);
    });

    it("rejects a multipart request without a presentation before the controller", async () => {
        const scenario = await createScenario("Doctor");
        const result = await sendPrepare(scenario.token);

        expect(result.response.status).toBe(403);
        expect(result.body.message).toBe("Verifiable presentation is required");
        expect(mockPrepare).not.toHaveBeenCalled();
        expect(getStoredRecordForUser(scenario.userId).used).toBe(false);
    });

    it("consumes SSI authorization before requireFile rejects a missing file", async () => {
        const scenario = await createScenario("Doctor");
        const presentation = await createPresentation(
            scenario.identity.did,
            [scenario.credential],
            scenario.pendingChallenge.challenge,
        );

        const result = await sendPrepare(scenario.token, presentation, false);

        expect(result.response.status).toBe(400);
        expect(result.body.message).toBe("Missing file upload");
        expect(mockPrepare).not.toHaveBeenCalled();
        expect(challengeRecords.find((record) => record.userId === scenario.userId)?.used).toBe(true);
    });
});
