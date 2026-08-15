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

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
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
});