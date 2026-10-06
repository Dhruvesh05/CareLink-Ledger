import { describe, expect, it, jest } from "@jest/globals";

type AnyMock = jest.Mock<(...args: any[]) => any>;

const mockGetMedicalRecord = jest.fn() as AnyMock;

jest.mock("../../services/MedicalRecordService", () => ({
    MedicalRecordService: jest.fn().mockImplementation(() => ({
        createMedicalRecord: jest.fn(),
        getMedicalRecord: mockGetMedicalRecord
    }))
}));

jest.mock("../../ipfs/adapters/IPFSServiceAdapter", () => ({
    __esModule: true,
    default: class {}
}));

import { MedicalRecordController } from "../../controllers/MedicalRecordController";

type VerifiedPresentationResult = {
    verified: boolean;
    error?: {
        message: string;
        errorCode: string;
    };
    verifiablePresentation?: {
        holder: string;
        verifiableCredential: Array<{
            credentialSubject: {
                role: string;
            };
        }>;
    };
};

type MedicalRecordContent = {
    content: Buffer;
    cid: string;
    fileHash: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    record: unknown;
};

type MockMedicalRecordService = {
    getMedicalRecordContent: jest.Mock<
        (recordId: number) => Promise<MedicalRecordContent>
    >;
};

type MockPresentationService = {
    verifyPresentation: jest.Mock<
        (presentation: unknown) => Promise<VerifiedPresentationResult>
    >;
};

type MockAuthorizationService = {
    authorize: jest.Mock<
        (
            did: string,
            action: string,
            verified: boolean,
            attributes: Record<string, unknown>,
        ) => Promise<boolean>
    >;
};

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("MedicalRecordController validation", () => {
    it("forwards the authenticated wallet to single-record reads", async () => {
        const controller = new MedicalRecordController();
        const res = createResponseMock();

        mockGetMedicalRecord.mockResolvedValue({
            recordId: 1
        });

        const authWallet =
            "0x1234567890123456789012345678901234567890";

        await controller.getMedicalRecord(
            {
                params: {
                    recordId: "1"
                },
                auth: {
                    userId: "test-user",
                    walletAddress: authWallet,
                    role: "Patient"
                }
            } as any,
            res as any
        );

        expect(
            mockGetMedicalRecord
        ).toHaveBeenCalledWith(
            1,
            authWallet
        );

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true
            })
        );
    });

    it("rejects invalid emergency boolean format", async () => {
        const controller = new MedicalRecordController();
        const res = createResponseMock();

        await controller.createMedicalRecord(
            {
                body: {
                    patient: "0x0000000000000000000000000000000000000001",
                    category: "general",
                    emergency: "not-a-boolean"
                }
            } as any,
            res as any
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false
            })
        );
    });

    function createControllerDependencies() {
        const medicalRecordService: MockMedicalRecordService = {
            getMedicalRecordContent: jest.fn() as MockMedicalRecordService["getMedicalRecordContent"]
        };
        const presentationService: MockPresentationService = {
            verifyPresentation: jest.fn() as MockPresentationService["verifyPresentation"]
        };
        const authorizationService: MockAuthorizationService = {
            authorize: jest.fn() as MockAuthorizationService["authorize"]
        };

        const controller = new MedicalRecordController(
            medicalRecordService as any,
            {} as any,
            {} as any,
            {} as any,
            presentationService as any,
            authorizationService as any
        );

        return {
            controller,
            medicalRecordService,
            presentationService,
            authorizationService
        };
    }

    it("verifies and authorizes before retrieving medical-record content", async () => {
        const {
            controller,
            medicalRecordService,
            presentationService,
            authorizationService
        } = createControllerDependencies();
        const order: string[] = [];
        const content = Buffer.from("verified-content");
        const res = createResponseMock();

        authorizationService.authorize.mockImplementation(async () => {
            order.push("authorize");
            return true;
        });
        medicalRecordService.getMedicalRecordContent.mockImplementation(async () => {
            order.push("retrieve");
            return {
                content,
                cid: "bafy-record-cid",
                fileHash: "a".repeat(64),
                fileName: "record.pdf",
                mimeType: "application/pdf",
                record: {}
            };
        });

        await controller.getMedicalRecordContent(
            {
                params: { recordId: "42" },
                careLinkAuth: {
                    userId: "user-1",
                    did: "did:key:holder",
                    role: "Doctor"
                }
            } as any,
            res as any
        );

        expect(order).toEqual([
            "authorize",
            "retrieve"
        ]);
        expect(authorizationService.authorize).toHaveBeenCalledWith(
            "did:key:holder",
            "read_patient_record",
            true,
            { role: "Doctor" }
        );
        expect(medicalRecordService.getMedicalRecordContent).toHaveBeenCalledWith(42);
        expect(res.send).toHaveBeenCalledWith(content);
    });

    it("rejects content retrieval when SSI middleware has not authorized the request", async () => {
        const {
            controller,
            medicalRecordService,
            authorizationService
        } = createControllerDependencies();
        const res = createResponseMock();

        await controller.getMedicalRecordContent(
            {
                params: { recordId: "42" }
            } as any,
            res as any
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(authorizationService.authorize).not.toHaveBeenCalled();
        expect(medicalRecordService.getMedicalRecordContent).not.toHaveBeenCalled();
    });

    it("rejects denied authorization without retrieving content", async () => {
        const {
            controller,
            medicalRecordService,
            presentationService,
            authorizationService
        } = createControllerDependencies();
        const res = createResponseMock();

        presentationService.verifyPresentation.mockResolvedValue({
            verified: true,
            verifiablePresentation: {
                holder: "did:key:holder",
                verifiableCredential: [
                    {
                        credentialSubject: {
                            role: "patient"
                        }
                    }
                ]
            }
        });
        authorizationService.authorize.mockResolvedValue(false);

        await controller.getMedicalRecordContent(
            {
                params: { recordId: "42" },
                careLinkAuth: {
                    userId: "user-1",
                    did: "did:key:holder",
                    role: "Patient"
                }
            } as any,
            res as any
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(medicalRecordService.getMedicalRecordContent).not.toHaveBeenCalled();
    });

    it("preserves retrieval integrity failures", async () => {
        const {
            controller,
            medicalRecordService,
            presentationService,
            authorizationService
        } = createControllerDependencies();
        const res = createResponseMock();

        presentationService.verifyPresentation.mockResolvedValue({
            verified: true,
            verifiablePresentation: {
                holder: "did:key:holder",
                verifiableCredential: [
                    {
                        credentialSubject: {
                            role: "doctor"
                        }
                    }
                ]
            }
        });
        authorizationService.authorize.mockResolvedValue(true);
        medicalRecordService.getMedicalRecordContent.mockRejectedValue(
            new Error("Medical record content integrity verification failed")
        );

        await controller.getMedicalRecordContent(
            {
                params: { recordId: "42" },
                careLinkAuth: {
                    userId: "user-1",
                    did: "did:key:holder",
                    role: "Doctor"
                }
            } as any,
            res as any
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Medical record content integrity verification failed"
            })
        );
    });
});