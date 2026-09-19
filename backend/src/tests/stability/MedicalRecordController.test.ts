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

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
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
});