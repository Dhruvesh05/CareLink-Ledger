import { MedicalRecordController } from "../../controllers/MedicalRecordController";

describe("MedicalRecordTransactionConfirmationController", () => {
    function createResponse() {
        const res: any = {
            status: jest.fn(),
            json: jest.fn()
        };

        res.status.mockReturnValue(res);

        return res;
    }

    test("uses authenticated JWT wallet as doctor and ignores body doctor", async () => {
        const confirm = jest.fn().mockResolvedValue({
            preparationId: "prep-123",
            recordId: 1,
            transactionHash: "0x" + "a".repeat(64),
            doctorWallet: "0x2222222222222222222222222222222222222222",
            hospitalWallet: "0x3333333333333333333333333333333333333333",
            patientWallet: "0x1111111111111111111111111111111111111111",
            cid: "bafy-test",
            fileHash: "a".repeat(64),
            fileName: "report.pdf",
            mimeType: "application/pdf",
            fileSize: 100,
            category: "General",
            emergency: false
        });

        const confirmationService: any = {
            confirm
        };

        const preparationService: any = {
            prepare: jest.fn()
        };

        const controller =
            new MedicalRecordController(
                undefined,
                undefined,
                preparationService,
                confirmationService
            );

        const req: any = {
            auth: {
                walletAddress:
                    "0x2222222222222222222222222222222222222222"
            },
            body: {
                preparationId: "prep-123",
                transactionHash:
                    "0x" + "a".repeat(64),

                // Malicious / conflicting body value.
                doctor:
                    "0x9999999999999999999999999999999999999999"
            }
        };

        const res = createResponse();

        await controller.confirmMedicalRecord(
            req,
            res
        );

        expect(confirm).toHaveBeenCalledTimes(1);

        expect(confirm).toHaveBeenCalledWith({
            preparationId: "prep-123",
            transactionHash:
                "0x" + "a".repeat(64),
            doctorWallet:
                "0x2222222222222222222222222222222222222222"
        });

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: expect.any(Object)
        });
    });

    test("rejects confirmation when JWT authentication is missing", async () => {
        const confirm = jest.fn();

        const confirmationService: any = {
            confirm
        };

        const preparationService: any = {
            prepare: jest.fn()
        };

        const controller =
            new MedicalRecordController(
                undefined,
                undefined,
                preparationService,
                confirmationService
            );

        const req: any = {
            body: {
                preparationId: "prep-123",
                transactionHash:
                    "0x" + "a".repeat(64)
            }
        };

        const res = createResponse();

        await controller.confirmMedicalRecord(
            req,
            res
        );

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message:
                "Authenticated wallet is required"
        });

        expect(confirm).not.toHaveBeenCalled();
    });
});
