import { describe, expect, it, jest } from "@jest/globals";

import { MedicalRecordController } from "../../controllers/MedicalRecordController";

function createResponseMock() {
    const res: any = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

describe("MedicalRecordController transaction preparation", () => {

    it("uses the authenticated JWT wallet as the doctor identity", async () => {

        const prepared = {
            transaction: {
                to: "0xEd76D2d27262bdB86f37e4191945c55E719ddf40",
                data: "0xc1dba53e1234",
                chainId: 80002,
                value: "0"
            },

            doctorWallet:
                "0x2222222222222222222222222222222222222222",

            hospitalWallet:
                "0x3333333333333333333333333333333333333333",

            patientWallet:
                "0x1111111111111111111111111111111111111111",

            cid:
                "bafybeigdyrzt5examplecid",

            fileHash:
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

            fileName:
                "record.pdf",

            mimeType:
                "application/pdf",

            fileSize:
                12345,

            category:
                "General",

            emergency:
                false
        };

        const prepareMock =
            jest.fn<
                (input: any) => Promise<typeof prepared>
            >()
            .mockResolvedValue(prepared);

        const preparationService =
            {
                prepare: prepareMock
            } as any;

        const confirmationService =
            {
                confirm: jest.fn()
            } as any;

        const controller =
            new MedicalRecordController(
                undefined,
                undefined,
                preparationService,
                confirmationService
            );

        const res =
            createResponseMock();

        const authenticatedDoctor =
            "0x2222222222222222222222222222222222222222";

        const maliciousBodyDoctor =
            "0x9999999999999999999999999999999999999999";

        const patient =
            "0x1111111111111111111111111111111111111111";

        const file =
            {
                buffer: Buffer.from("test medical record"),
                originalname: "record.pdf",
                mimetype: "application/pdf"
            } as any;

        await controller.prepareMedicalRecord(
            {
                auth: {
                    userId: "test-user",
                    walletAddress: authenticatedDoctor,
                    role: "Doctor"
                },

                body: {
                    doctor: maliciousBodyDoctor,
                    patient,
                    category: "General",
                    emergency: "false"
                },

                file
            } as any,
            res as any
        );

        expect(prepareMock)
            .toHaveBeenCalledTimes(1);

        expect(prepareMock)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    doctorWallet: authenticatedDoctor,
                    patientWallet: patient,
                    category: "General",
                    emergency: false,
                    file
                })
            );

        const call =
            prepareMock.mock.calls[0][0];

        expect(call.doctorWallet)
            .toBe(authenticatedDoctor);

        expect(call.doctorWallet)
            .not.toBe(maliciousBodyDoctor);

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    transaction: expect.objectContaining({
                        to: "0xEd76D2d27262bdB86f37e4191945c55E719ddf40",
                        chainId: 80002,
                        value: "0"
                    }),
                    doctorWallet: authenticatedDoctor,
                    patientWallet: patient
                })
            });
    });


    it("rejects preparation when authenticated wallet is missing", async () => {

        const prepareMock =
            jest.fn();

        const preparationService =
            {
                prepare: prepareMock
            } as any;

        const confirmationService =
            {
                confirm: jest.fn()
            } as any;

        const controller =
            new MedicalRecordController(
                undefined,
                undefined,
                preparationService,
                confirmationService
            );

        const res =
            createResponseMock();

        await controller.prepareMedicalRecord(
            {
                auth: undefined,

                body: {
                    patient:
                        "0x1111111111111111111111111111111111111111",

                    category:
                        "General",

                    emergency:
                        "false"
                },

                file: {
                    buffer: Buffer.from("test"),
                    originalname: "record.pdf",
                    mimetype: "application/pdf"
                }
            } as any,
            res as any
        );

        expect(res.status)
            .toHaveBeenCalledWith(401);

        expect(prepareMock)
            .not.toHaveBeenCalled();
    });

});
