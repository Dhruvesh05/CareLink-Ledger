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
const mockGetMedicalRecord = jest.fn() as AnyMock;

const mockMongoCreate = jest.fn() as AnyMock;
const mockMongoFindOne = jest.fn() as AnyMock;
const mockMongoUpdateOne = jest.fn() as AnyMock;

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
import { sha256FromBuffer } from "../../utils/hash";

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
        downloadFile: AnyMock;
    };

    let mockBlockchainProvider: {
        createMedicalRecord: AnyMock;
        updateMedicalRecord: AnyMock;
        deactivateMedicalRecord: AnyMock;
        getMedicalRecord: AnyMock;
    };

    let service: MedicalRecordService;

    beforeEach(() => {

        jest.clearAllMocks();

        mockCreateMedicalRecord.mockReset();
        mockUpdateMedicalRecord.mockReset();
        mockDeactivateMedicalRecord.mockReset();
        mockGetMedicalRecord.mockReset();

        mockMongoCreate.mockReset();
        mockMongoFindOne.mockReset();
        mockMongoUpdateOne.mockReset();

        mockIpfsService = {
            uploadFile: jest.fn() as AnyMock,
            unpinFile: jest.fn() as AnyMock,
            downloadFile: jest.fn() as AnyMock
        };

        mockBlockchainProvider = {
            createMedicalRecord: mockCreateMedicalRecord,
            updateMedicalRecord: mockUpdateMedicalRecord,
            deactivateMedicalRecord: mockDeactivateMedicalRecord,
            getMedicalRecord: mockGetMedicalRecord
        };

        service = new MedicalRecordService(
            mockIpfsService as any,
            mockBlockchainProvider as any
        );
    });

    describe("getMedicalRecord", () => {
        it("forwards the caller to the blockchain provider", async () => {
            const caller =
                "0x1234567890123456789012345678901234567890";

            mockGetMedicalRecord.mockResolvedValue({
                recordId: 1
            });

            const result =
                await service.getMedicalRecord(
                    1,
                    caller
                );

            expect(
                mockGetMedicalRecord
            ).toHaveBeenCalledWith(
                1,
                caller
            );

            expect(result).toEqual({
                recordId: 1
            });
        });
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

    describe("getMedicalRecordContent", () => {

        it(
            "downloads content using the CID from the medical record",
            async () => {

                const content =
                    Buffer.from(
                        "medical-record-content"
                    );

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(content),
                    category: "diagnostic"
                });

                mockIpfsService.downloadFile
                    .mockResolvedValue(
                        content
                    );

                mockMongoFindOne.mockResolvedValue({
                    fileName: "report.pdf",
                    mimeType: "application/pdf",
                    fileSize: content.length
                });

                const result =
                    await service.getMedicalRecordContent(42);

                expect(
                    mockGetMedicalRecord
                ).toHaveBeenCalledWith(42);

                expect(
                    mockIpfsService.downloadFile
                ).toHaveBeenCalledWith(
                    "bafy-record-cid"
                );

                expect(result).toEqual({
                    content,
                    cid: "bafy-record-cid",
                    fileHash: sha256FromBuffer(content),
                    record: {
                        ipfsHash: "bafy-record-cid",
                        fileHash: sha256FromBuffer(content),
                        category: "diagnostic"
                    },
                    fileName: "report.pdf",
                    mimeType: "application/pdf",
                    fileSize: content.length
                });
            }
        );

        it(
            "propagates a missing medical-record error",
            async () => {

                const underlying =
                    new Error(
                        "Medical record not found"
                    );

                mockGetMedicalRecord.mockRejectedValue(
                    underlying
                );

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toBe(
                    underlying
                );

                expect(
                    mockIpfsService.downloadFile
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "rejects a medical record with no CID",
            async () => {

                mockGetMedicalRecord.mockResolvedValue({
                    fileHash: "stored-file-hash"
                });

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toThrow(
                    "Medical record CID is missing"
                );

                expect(
                    mockIpfsService.downloadFile
                ).not.toHaveBeenCalled();
            }
        );

        it(
            "propagates IPFS download failures",
            async () => {

                const underlying =
                    new Error(
                        "IPFS download failed"
                    );

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(
                        Buffer.from("different-content")
                    )
                });

                mockIpfsService.downloadFile
                    .mockRejectedValue(
                        underlying
                    );

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toBe(
                    underlying
                );
            }
        );

        it(
            "rejects content when the downloaded hash does not match",
            async () => {

                const downloaded =
                    Buffer.from(
                        "altered-content"
                    );

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(
                        Buffer.from("original-content")
                    )
                });

                mockIpfsService.downloadFile
                    .mockResolvedValue(
                        downloaded
                    );

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toThrow(
                    "Medical record content integrity verification failed"
                );
            }
        );

        it(
            "rejects content when the stored file hash is missing or invalid",
            async () => {

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: "stored-file-hash"
                });

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toThrow(
                    "Medical record file hash is missing or invalid"
                );

                expect(
                    mockIpfsService.downloadFile
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
