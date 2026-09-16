import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../services/MedicalRecordService", () => ({
    MedicalRecordService: jest.fn().mockImplementation(() => ({
        createMedicalRecord: jest.fn()
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
        const presentation = { proof: { jwt: "vp-jwt" } };
        const content = Buffer.from("verified-content");
        const res = createResponseMock();

        presentationService.verifyPresentation.mockImplementation(async () => {
            order.push("verify");
            return {
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
            };
        });
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
                body: { presentation }
            } as any,
            res as any
        );

        expect(order).toEqual([
            "verify",
            "authorize",
            "retrieve"
        ]);
        expect(authorizationService.authorize).toHaveBeenCalledWith(
            "did:key:holder",
            "read_patient_record",
            true,
            { role: "doctor" }
        );
        expect(medicalRecordService.getMedicalRecordContent).toHaveBeenCalledWith(42);
        expect(res.send).toHaveBeenCalledWith(content);
    });

    it("rejects invalid VP verification without authorization or retrieval", async () => {
        const {
            controller,
            medicalRecordService,
            presentationService,
            authorizationService
        } = createControllerDependencies();
        const res = createResponseMock();

        presentationService.verifyPresentation.mockResolvedValue({
            verified: false,
            error: {
                message: "JWT signature invalid",
                errorCode: "invalid_signature"
            }
        });

        await controller.getMedicalRecordContent(
            {
                params: { recordId: "42" },
                body: { presentation: { proof: { jwt: "bad" } } }
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
                body: { presentation: { proof: { jwt: "vp-jwt" } } }
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
                body: { presentation: { proof: { jwt: "vp-jwt" } } }
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