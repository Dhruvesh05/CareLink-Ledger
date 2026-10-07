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
const mockIsAuthorizedDoctor = jest.fn() as AnyMock;

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
import { KeyManagementService } from "../../services/encryption/KeyManagementService";
import { MedicalRecordEncryptionService } from "../../services/encryption/MedicalRecordEncryptionService";

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
        isAuthorizedDoctor: AnyMock;
    };

    let service: MedicalRecordService;
    let keyManagementService: KeyManagementService;
    const encryptionService = new MedicalRecordEncryptionService();

    beforeEach(() => {

        jest.clearAllMocks();

        mockCreateMedicalRecord.mockReset();
        mockUpdateMedicalRecord.mockReset();
        mockDeactivateMedicalRecord.mockReset();
        mockGetMedicalRecord.mockReset();
        mockIsAuthorizedDoctor.mockReset();

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
            getMedicalRecord: mockGetMedicalRecord,
            isAuthorizedDoctor: mockIsAuthorizedDoctor
        };

        keyManagementService =
            new KeyManagementService();

        service = new MedicalRecordService(
            mockIpfsService as any,
            mockBlockchainProvider as any,
            keyManagementService,
            encryptionService
        );
    });

    async function configureReadableRecord(
        record: Record<string, unknown>
    ) {
        const content = Buffer.from("authorized-content");
        const managedKey = await keyManagementService.createKey();
        const encrypted = encryptionService.encrypt(
            content,
            managedKey.key,
            managedKey.reference
        );

        mockGetMedicalRecord.mockResolvedValue({
            ...record,
            ipfsHash: "bafy-record-cid",
            fileHash: sha256FromBuffer(encrypted.ciphertext)
        });
        mockMongoFindOne.mockResolvedValue({
            encryptionVersion: encrypted.metadata.version,
            encryptionAlgorithm: encrypted.metadata.algorithm,
            encryptionIv: encrypted.metadata.iv,
            encryptionAuthTag: encrypted.metadata.authTag,
            encryptionKeyReference: encrypted.metadata.keyReference
        });
        mockIpfsService.downloadFile.mockResolvedValue(encrypted.ciphertext);

        return content;
    }

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
                    expect.any(Buffer),
                    "report.pdf",
                    "application/pdf"
                );
                expect(
                    mockIpfsService.uploadFile.mock.calls[0][0]
                ).not.toEqual(file.buffer);

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
                        transactionHash: "0xtxhash",
                        encryptionVersion: 1,
                        encryptionAlgorithm: "aes-256-gcm",
                        encryptionIv: expect.any(String),
                        encryptionAuthTag: expect.any(String),
                        encryptionKeyReference: expect.any(String)
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
                const managedKey =
                    await keyManagementService.createKey();
                const encrypted =
                    encryptionService.encrypt(
                        content,
                        managedKey.key,
                        managedKey.reference
                    );

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(encrypted.ciphertext),
                    category: "diagnostic"
                });

                mockIpfsService.downloadFile
                    .mockResolvedValue(
                        encrypted.ciphertext
                    );

                mockMongoFindOne.mockResolvedValue({
                    fileName: "report.pdf",
                    mimeType: "application/pdf",
                    fileSize: content.length,
                    encryptionVersion:
                        encrypted.metadata.version,
                    encryptionAlgorithm:
                        encrypted.metadata.algorithm,
                    encryptionIv:
                        encrypted.metadata.iv,
                    encryptionAuthTag:
                        encrypted.metadata.authTag,
                    encryptionKeyReference:
                        encrypted.metadata.keyReference
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
                    fileHash: sha256FromBuffer(encrypted.ciphertext),
                    record: {
                        ipfsHash: "bafy-record-cid",
                        fileHash: sha256FromBuffer(encrypted.ciphertext),
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
            "rejects tampered ciphertext after integrity verification",
            async () => {
                const managedKey =
                    await keyManagementService.createKey();
                const encrypted =
                    encryptionService.encrypt(
                        Buffer.from("original-content"),
                        managedKey.key,
                        managedKey.reference
                    );
                const tampered =
                    Buffer.from(encrypted.ciphertext);
                tampered[0] ^= 1;

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(tampered),
                    encryptionVersion:
                        encrypted.metadata.version,
                    encryptionAlgorithm:
                        encrypted.metadata.algorithm,
                    encryptionIv:
                        encrypted.metadata.iv,
                    encryptionAuthTag:
                        encrypted.metadata.authTag,
                    encryptionKeyReference:
                        encrypted.metadata.keyReference
                });
                mockIpfsService.downloadFile.mockResolvedValue(tampered);

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toThrow();
            }
        );

        it(
            "rejects content when its encryption key is unavailable",
            async () => {
                const otherKeyManagementService =
                    new KeyManagementService();
                const managedKey =
                    await otherKeyManagementService.createKey();
                const encrypted =
                    encryptionService.encrypt(
                        Buffer.from("protected-content"),
                        managedKey.key,
                        managedKey.reference
                    );

                mockGetMedicalRecord.mockResolvedValue({
                    ipfsHash: "bafy-record-cid",
                    fileHash: sha256FromBuffer(encrypted.ciphertext),
                    encryptionVersion:
                        encrypted.metadata.version,
                    encryptionAlgorithm:
                        encrypted.metadata.algorithm,
                    encryptionIv:
                        encrypted.metadata.iv,
                    encryptionAuthTag:
                        encrypted.metadata.authTag,
                    encryptionKeyReference:
                        encrypted.metadata.keyReference
                });
                mockMongoFindOne.mockResolvedValue({
                    encryptionVersion:
                        encrypted.metadata.version,
                    encryptionAlgorithm:
                        encrypted.metadata.algorithm,
                    encryptionIv:
                        encrypted.metadata.iv,
                    encryptionAuthTag:
                        encrypted.metadata.authTag,
                    encryptionKeyReference:
                        encrypted.metadata.keyReference
                });
                mockIpfsService.downloadFile.mockResolvedValue(
                    encrypted.ciphertext
                );

                await expect(
                    service.getMedicalRecordContent(42)
                ).rejects.toThrow("Encryption key is unavailable");
            }
        );

        it("allows an authorized patient to retrieve their own record", async () => {
            const wallet =
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            const content = await configureReadableRecord({
                patient: wallet,
                active: true
            });

            const result = await service.getMedicalRecordContent(42, {
                walletAddress: wallet,
                role: "Patient"
            });

            expect(result.content).toEqual(content);
            expect(mockIpfsService.downloadFile).toHaveBeenCalled();
        });

        it("allows the treating doctor to retrieve the record", async () => {
            const wallet =
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
            await configureReadableRecord({
                doctor: wallet,
                active: true
            });

            await service.getMedicalRecordContent(42, {
                walletAddress: wallet,
                role: "Doctor"
            });

            expect(mockIpfsService.downloadFile).toHaveBeenCalled();
            expect(mockIsAuthorizedDoctor).not.toHaveBeenCalled();
        });

        it("allows a doctor with an existing grant to retrieve the record", async () => {
            const wallet =
                "0xcccccccccccccccccccccccccccccccccccccc";
            await configureReadableRecord({
                doctor: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                active: true
            });
            mockIsAuthorizedDoctor.mockResolvedValue(true);

            await service.getMedicalRecordContent(42, {
                walletAddress: wallet,
                role: "Doctor"
            });

            expect(mockIsAuthorizedDoctor).toHaveBeenCalledWith(42, wallet);
            expect(mockIpfsService.downloadFile).toHaveBeenCalled();
        });

        it("allows the associated hospital to retrieve the record", async () => {
            const wallet =
                "0xdddddddddddddddddddddddddddddddddddddd";
            await configureReadableRecord({
                hospital: wallet,
                active: true
            });

            await service.getMedicalRecordContent(42, {
                walletAddress: wallet,
                role: "Hospital"
            });

            expect(mockIpfsService.downloadFile).toHaveBeenCalled();
        });

        it("rejects inactive records before IPFS and key retrieval", async () => {
            const wallet =
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            mockGetMedicalRecord.mockResolvedValue({
                patient: wallet,
                active: false
            });
            const getKey = jest.spyOn(keyManagementService, "getKey");

            await expect(
                service.getMedicalRecordContent(42, {
                    walletAddress: wallet,
                    role: "Patient"
                })
            ).rejects.toThrow("InactiveRecord");

            expect(mockIpfsService.downloadFile).not.toHaveBeenCalled();
            expect(getKey).not.toHaveBeenCalled();
            getKey.mockRestore();
        });

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
