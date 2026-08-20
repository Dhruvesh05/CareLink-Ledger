import {
    beforeEach,
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

type AnyMock = jest.Mock<(...args: any[]) => any>;

const mockCreateMedicalRecord = jest.fn() as AnyMock;
const mockUpdateMedicalRecord = jest.fn() as AnyMock;
const mockDeactivateMedicalRecord = jest.fn() as AnyMock;

const mockMongoCreate = jest.fn() as AnyMock;
const mockMongoFindOne = jest.fn() as AnyMock;
const mockMongoUpdateOne = jest.fn() as AnyMock;

jest.mock(
    "../../blockchain/ethereum/services/EthereumMedicalRecordService",
    () => ({
        EthereumMedicalRecordService: jest
            .fn()
            .mockImplementation(() => ({
                createMedicalRecord: mockCreateMedicalRecord,
                updateMedicalRecord: mockUpdateMedicalRecord,
                deactivateMedicalRecord: mockDeactivateMedicalRecord
            }))
    })
);

jest.mock(
    "../../models/MedicalRecordModel",
    () => ({
        __esModule: true,

        default: {
            create: mockMongoCreate,
            findOne: mockMongoFindOne,
            updateOne: mockMongoUpdateOne
        },

        MedicalRecordModel: {
            create: mockMongoCreate,
            findOne: mockMongoFindOne,
            updateOne: mockMongoUpdateOne
        }
    })
);

import { MedicalRecordService } from "../../services/MedicalRecordService";

describe("MedicalRecordService IPFS transaction flow", () => {

    const patient =
        "0x1234567890123456789012345678901234567890";

    const file = {
        buffer: Buffer.from("medical-record-content"),
        originalname: "report.pdf",
        mimetype: "application/pdf"
    } as Express.Multer.File;

    let mockIpfsService: {
        uploadFile: AnyMock;
        unpinFile: AnyMock;
    };

    let service: MedicalRecordService;

    beforeEach(() => {

        jest.clearAllMocks();

        mockCreateMedicalRecord.mockReset();
        mockUpdateMedicalRecord.mockReset();
        mockDeactivateMedicalRecord.mockReset();

        mockMongoCreate.mockReset();
        mockMongoFindOne.mockReset();
        mockMongoUpdateOne.mockReset();

        mockIpfsService = {
            uploadFile: jest.fn() as AnyMock,
            unpinFile: jest.fn() as AnyMock
        };

        service = new MedicalRecordService(
            mockIpfsService as any
        );
    });

    describe("createMedicalRecord", () => {

        it(
            "uploads to IPFS, commits blockchain, then persists MongoDB metadata",
            async () => {

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-test-cid",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl: "http://gateway/bafy-test-cid"
                });

                mockCreateMedicalRecord.mockResolvedValue({
                    recordId: 42,
                    transactionHash: "0xtxhash"
                });

                mockMongoCreate.mockResolvedValue({
                    recordId: 42
                });

                const result =
                    await service.createMedicalRecord(
                        patient,
                        file,
                        "diagnostic",
                        false
                    );

                expect(result).toEqual({
                    recordId: 42,
                    transactionHash: "0xtxhash"
                });

                expect(
                    mockIpfsService.uploadFile
                ).toHaveBeenCalledWith(
                    file.buffer,
                    "report.pdf",
                    "application/pdf"
                );

                expect(
                    mockCreateMedicalRecord
                ).toHaveBeenCalledWith(
                    patient,
                    "bafy-test-cid",
                    expect.stringMatching(/^[a-f0-9]{64}$/),
                    "diagnostic",
                    false
                );

                expect(
                    mockMongoCreate
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        recordId: 42,
                        patientWallet: patient,
                        fileName: "report.pdf",
                        mimeType: "application/pdf",
                        fileSize: file.buffer.length,
                        cid: "bafy-test-cid",
                        category: "diagnostic",
                        emergency: false,
                        transactionHash: "0xtxhash"
                    })
                );

                expect(
                    mockIpfsService.unpinFile
                ).not.toHaveBeenCalled();

                expect(
                    mockDeactivateMedicalRecord
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "unpins the CID when blockchain creation fails",
            async () => {

                const blockchainError =
                    new Error(
                        "blockchain transaction failed"
                    );

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-failed-cid",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl:
                        "http://gateway/bafy-failed-cid"
                });

                mockCreateMedicalRecord.mockRejectedValue(
                    blockchainError
                );

                await expect(
                    service.createMedicalRecord(
                        patient,
                        file,
                        "diagnostic",
                        false
                    )
                ).rejects.toBe(
                    blockchainError
                );

                expect(
                    mockIpfsService.unpinFile
                ).toHaveBeenCalledWith(
                    "bafy-failed-cid"
                );

                expect(
                    mockMongoCreate
                ).not.toHaveBeenCalled();

                expect(
                    mockDeactivateMedicalRecord
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "does not unpin when MongoDB fails after blockchain commit, and deactivates the record",
            async () => {

                const mongoError =
                    new Error(
                        "MongoDB persistence failed"
                    );

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-mongo-failure-cid",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl:
                        "http://gateway/bafy-mongo-failure-cid"
                });

                mockCreateMedicalRecord.mockResolvedValue({
                    recordId: 77,
                    transactionHash: "0xmongofailure"
                });

                mockMongoCreate.mockRejectedValue(
                    mongoError
                );

                await expect(
                    service.createMedicalRecord(
                        patient,
                        file,
                        "diagnostic",
                        false
                    )
                ).rejects.toBe(
                    mongoError
                );

                expect(
                    mockDeactivateMedicalRecord
                ).toHaveBeenCalledWith(77);

                expect(
                    mockIpfsService.unpinFile
                ).not.toHaveBeenCalled();
            }
        );
    });

    describe("updateMedicalRecord", () => {

        it(
            "updates blockchain and MongoDB without unpinning after success",
            async () => {

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-update-cid",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl:
                        "http://gateway/bafy-update-cid"
                });

                mockUpdateMedicalRecord.mockResolvedValue({
                    transactionHash: "0xupdate"
                });

                mockMongoFindOne.mockResolvedValue({
                    recordId: 42,
                    patientWallet: patient,
                    emergency: false,
                    transactionHash: "0xold"
                });

                mockMongoUpdateOne.mockResolvedValue({
                    acknowledged: true
                });

                await service.updateMedicalRecord(
                    42,
                    file,
                    "updated-diagnostic",
                    1
                );

                expect(
                    mockUpdateMedicalRecord
                ).toHaveBeenCalledWith(
                    42,
                    "bafy-update-cid",
                    expect.stringMatching(/^[a-f0-9]{64}$/),
                    "updated-diagnostic",
                    1
                );

                expect(
                    mockMongoUpdateOne
                ).toHaveBeenCalledWith(
                    { recordId: 42 },
                    expect.objectContaining({
                        $set: expect.objectContaining({
                            cid: "bafy-update-cid",
                            fileName: "report.pdf",
                            mimeType: "application/pdf",
                            category: "updated-diagnostic"
                        })
                    })
                );

                expect(
                    mockIpfsService.unpinFile
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "unpins the new CID when blockchain update fails",
            async () => {

                const blockchainError =
                    new Error(
                        "blockchain update failed"
                    );

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-update-failed-cid",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl:
                        "http://gateway/bafy-update-failed-cid"
                });

                mockUpdateMedicalRecord.mockRejectedValue(
                    blockchainError
                );

                await expect(
                    service.updateMedicalRecord(
                        42,
                        file,
                        "diagnostic",
                        1
                    )
                ).rejects.toBe(
                    blockchainError
                );

                expect(
                    mockIpfsService.unpinFile
                ).toHaveBeenCalledWith(
                    "bafy-update-failed-cid"
                );

                expect(
                    mockMongoFindOne
                ).not.toHaveBeenCalled();

                expect(
                    mockMongoUpdateOne
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "does not unpin the new CID when MongoDB update fails after blockchain commit",
            async () => {

                const mongoError =
                    new Error(
                        "MongoDB update failed"
                    );

                mockIpfsService.uploadFile.mockResolvedValue({
                    cid: "bafy-update-mongo-failure",
                    size: file.buffer.length,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    gatewayUrl:
                        "http://gateway/bafy-update-mongo-failure"
                });

                mockUpdateMedicalRecord.mockResolvedValue({
                    transactionHash: "0xupdate-mongo"
                });

                mockMongoFindOne.mockResolvedValue({
                    recordId: 42,
                    patientWallet: patient,
                    emergency: false,
                    transactionHash: "0xold"
                });

                mockMongoUpdateOne.mockRejectedValue(
                    mongoError
                );

                await expect(
                    service.updateMedicalRecord(
                        42,
                        file,
                        "diagnostic",
                        1
                    )
                ).rejects.toBe(
                    mongoError
                );

                expect(
                    mockIpfsService.unpinFile
                ).not.toHaveBeenCalled();
            }
        );
    });
});
