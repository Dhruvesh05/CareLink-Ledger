import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../models/PreparedMedicalRecordModel", () => ({
    __esModule: true,
    default: {
        create: jest.fn()
    }
}));

import { MedicalRecordTransactionPreparationService } from "../../services/blockchain/MedicalRecordTransactionPreparationService";
import PreparedMedicalRecordModel
    from "../../models/PreparedMedicalRecordModel";
import { IBlockchainProvider } from "../../blockchain/provider/IBlockchainProvider";

describe("MedicalRecordTransactionPreparationService", () => {

    it("prepares an unsigned medical-record transaction without submitting a blockchain transaction", async () => {

        const doctorWallet =
            "0x2222222222222222222222222222222222222222";

        const hospitalWallet =
            "0x3333333333333333333333333333333333333333";

        const patientWallet =
            "0x1111111111111111111111111111111111111111";

        const fileBuffer =
            Buffer.from("CareLink medical record test");

        const expectedCid =
            "bafybeigdyrzt5examplecid";

        const expectedTransaction = {
            to: "0xEd76D2d27262bdB86f37e4191945c55E719ddf40",
            data: "0xc1dba53e1234",
            chainId: 80002,
            value: "0"
        };

        const preflightService = {
            validateDoctor:
                jest.fn<
                    (wallet: string) => Promise<any>
                >()
                .mockResolvedValue({
                    doctor: doctorWallet,
                    hospital: hospitalWallet,
                    doctorRole: "Doctor",
                    doctorActive: true,
                    doctorVerified: true,
                    hospitalActive: true,
                    hospitalVerified: true
                })
        };

        const ipfsService = {
            uploadFile:
                jest.fn<
                    (
                        file: Buffer,
                        fileName: string,
                        mimeType: string
                    ) => Promise<any>
                >()
                .mockResolvedValue({
                    cid: expectedCid,
                    size: fileBuffer.length,
                    fileName: "record.pdf",
                    mimeType: "application/pdf",
                    gatewayUrl:
                        `https://gateway.example/ipfs/${expectedCid}`
                }),

            unpinFile:
                jest.fn()
        };

        const transactionBuilder = {
            buildCreateMedicalRecordTransaction:
                jest.fn().mockReturnValue(
                    expectedTransaction
                )
        };

        const blockchainService: Pick<
            IBlockchainProvider,
            "isPatientActive"
        > = {
            isPatientActive:
                jest.fn<
                    (wallet: string) => Promise<boolean>
                >()
                .mockResolvedValue(true)
        };

        const service =
            new MedicalRecordTransactionPreparationService(
                ipfsService as any,
                blockchainService as IBlockchainProvider,
                preflightService as any,
                transactionBuilder as any
            );

        const createMock =
            PreparedMedicalRecordModel.create as jest.MockedFunction<
                typeof PreparedMedicalRecordModel.create
            >;

        createMock.mockResolvedValue({} as any);

        const result =
            await service.prepare({
                doctorWallet,
                patientWallet,
                file: {
                    buffer: fileBuffer,
                    originalname: "record.pdf",
                    mimetype: "application/pdf"
                } as any,
                category: "General",
                emergency: false
            });

        /*
         * The preparation must be persisted server-side before
         * the unsigned transaction is returned.
         */
        expect(
            PreparedMedicalRecordModel.create
        ).toHaveBeenCalledTimes(1);

        const preparationDocument =
            createMock.mock.calls[0][0] as any;

        expect(preparationDocument.preparationId)
            .toBe(result.preparationId);

        expect(preparationDocument.doctorWallet)
            .toBe(doctorWallet.toLowerCase());

        expect(preparationDocument.hospitalWallet)
            .toBe(hospitalWallet.toLowerCase());

        expect(preparationDocument.patientWallet)
            .toBe(patientWallet.toLowerCase());

        expect(preparationDocument.cid)
            .toBe(expectedCid);

        expect(preparationDocument.fileHash)
            .toBe(result.fileHash);

        expect(preparationDocument.fileName)
            .toBe("record.pdf");

        expect(preparationDocument.mimeType)
            .toBe("application/pdf");

        expect(preparationDocument.fileSize)
            .toBe(fileBuffer.length);

        expect(preparationDocument.category)
            .toBe("General");

        expect(preparationDocument.emergency)
            .toBe(false);

        expect(preparationDocument.chainId)
            .toBe(80002);

        expect(preparationDocument.contractAddress)
            .toBe(expectedTransaction.to);

        expect(preparationDocument.status)
            .toBe("prepared");

        expect(preparationDocument.expiresAt)
            .toBeInstanceOf(Date);

        expect(
            preparationDocument.expiresAt.getTime()
        ).toBeGreaterThan(Date.now());

        /*
         * Doctor identity must come from the authenticated
         * wallet passed into the preparation service.
         */
        expect(
            preflightService.validateDoctor
        ).toHaveBeenCalledWith(
            doctorWallet
        );

        /*
         * Patient validation must use the blockchain abstraction
         * and must remain read-only.
         */
        expect(
            blockchainService.isPatientActive
        ).toHaveBeenCalledTimes(1);

        expect(
            blockchainService.isPatientActive
        ).toHaveBeenCalledWith(
            patientWallet
        );

        /*
         * Verify the file was uploaded exactly once.
         */
        expect(
            ipfsService.uploadFile
        ).toHaveBeenCalledTimes(1);

        expect(
            ipfsService.uploadFile
        ).toHaveBeenCalledWith(
            fileBuffer,
            "record.pdf",
            "application/pdf"
        );

        /*
         * Verify the transaction builder receives:
         * patient + CID + exact SHA-256 + category + emergency.
         */
        expect(
            transactionBuilder
                .buildCreateMedicalRecordTransaction
        ).toHaveBeenCalledTimes(1);

        const builderCall =
            transactionBuilder
                .buildCreateMedicalRecordTransaction
                .mock.calls[0];

        expect(builderCall[0])
            .toBe(patientWallet);

        expect(builderCall[1])
            .toBe(expectedCid);

        expect(builderCall[2])
            .toMatch(/^[a-f0-9]{64}$/);

        expect(builderCall[3])
            .toBe("General");

        expect(builderCall[4])
            .toBe(false);

        /*
         * The service must return the unsigned transaction.
         */
        expect(result.transaction)
            .toEqual(expectedTransaction);

        expect(result.doctorWallet)
            .toBe(doctorWallet);

        expect(result.hospitalWallet)
            .toBe(hospitalWallet);

        expect(result.patientWallet)
            .toBe(patientWallet);

        expect(result.cid)
            .toBe(expectedCid);

        expect(result.fileHash)
            .toBe(builderCall[2]);

        expect(result.fileName)
            .toBe("record.pdf");

        expect(result.mimeType)
            .toBe("application/pdf");

        expect(result.fileSize)
            .toBe(fileBuffer.length);

        expect(result.category)
            .toBe("General");

        expect(result.emergency)
            .toBe(false);

        /*
         * There is intentionally no signer, wallet, sendTransaction,
         * or transaction hash involved in this service.
         */
        expect(
            transactionBuilder
                .buildCreateMedicalRecordTransaction
        ).toHaveReturnedWith(expectedTransaction);
    });


    it("rejects an invalid doctor wallet before blockchain preparation", async () => {

        const preflightService = {
            validateDoctor:
                jest.fn()
        };

        const ipfsService = {
            uploadFile:
                jest.fn(),

            unpinFile:
                jest.fn()
        };

        const transactionBuilder = {
            buildCreateMedicalRecordTransaction:
                jest.fn()
        };

        const blockchainService: Pick<
            IBlockchainProvider,
            "isPatientActive"
        > = {
            isPatientActive:
                jest.fn<
                    (wallet: string) => Promise<boolean>
                >()
                .mockResolvedValue(true)
        };

        const service =
            new MedicalRecordTransactionPreparationService(
                ipfsService as any,
                blockchainService as IBlockchainProvider,
                preflightService as any,
                transactionBuilder as any
            );

        await expect(
            service.prepare({
                doctorWallet: "not-a-wallet",
                patientWallet:
                    "0x1111111111111111111111111111111111111111",
                file: {
                    buffer: Buffer.from("test"),
                    originalname: "record.pdf",
                    mimetype: "application/pdf"
                } as any,
                category: "General",
                emergency: false
            })
        ).rejects.toThrow(
            "Invalid doctor wallet address"
        );

        expect(
            preflightService.validateDoctor
        ).not.toHaveBeenCalled();

        expect(
            ipfsService.uploadFile
        ).not.toHaveBeenCalled();

        expect(
            transactionBuilder
                .buildCreateMedicalRecordTransaction
        ).not.toHaveBeenCalled();
    });

});
