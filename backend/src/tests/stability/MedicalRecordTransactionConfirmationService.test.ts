import {
    beforeEach,
    describe,
    expect,
    jest,
    test
} from "@jest/globals";
import { createRequire } from "node:module";

const testRequire = createRequire(import.meta.url);

const mockProvider = {
    getNetwork: jest.fn(),
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getBlock: jest.fn()
};

const mockContract = {
    recordExists: jest.fn()
};

jest.unstable_mockModule("ethers", () => {
    const actual =
        jest.requireActual<typeof import("ethers")>("ethers");

    return {
        ...actual,
        JsonRpcProvider: jest.fn(() => mockProvider),
        Contract: jest.fn(() => mockContract)
    };
});

jest.unstable_mockModule("../../config/env", () => ({
    env: {
        POLYGON_RPC: "http://mock-polygon-rpc",
        POLYGON_MEDICAL_RECORD_ADDRESS:
            "0xEd76D2d27262bdB86f37e4191945c55E719ddf40"
    }
}));

jest.unstable_mockModule("../../models/PreparedMedicalRecordModel", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule("../../models/MedicalRecordModel", () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        findOne: jest.fn()
    }
}));

const { ethers } = await import("ethers");

const { default: MedicalRecordModel } =
    await import("../../models/MedicalRecordModel");

const { default: PreparedMedicalRecordModel } =
    await import("../../models/PreparedMedicalRecordModel");

const {
    MedicalRecordTransactionConfirmationService
} = await import(
    "../../services/blockchain/MedicalRecordTransactionConfirmationService.ts"
);

const preparedModel =
    PreparedMedicalRecordModel as any;

const medicalRecordModel =
    MedicalRecordModel as any;

const provider =
    mockProvider as any;

const contract =
    mockContract as any;

const DOCTOR =
    "0x2222222222222222222222222222222222222222";

const PATIENT =
    "0x1111111111111111111111111111111111111111";

const HOSPITAL =
    "0x3333333333333333333333333333333333333333";

const OTHER_DOCTOR =
    "0x9999999999999999999999999999999999999999";

const CONTRACT =
    "0xEd76D2d27262bdB86f37e4191945c55E719ddf40";

const CID =
    "bafybeigdyrzt5examplecid";

const FILE_HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const PLAINTEXT_HASH =
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const TX_HASH =
    "0x" + "a".repeat(64);

function createPreparation(overrides: any = {}) {
    return {
        _id: "mongo-preparation-id",

        preparationId:
            "prep-123",

        doctorWallet:
            DOCTOR.toLowerCase(),

        hospitalWallet:
            HOSPITAL.toLowerCase(),

        patientWallet:
            PATIENT.toLowerCase(),

        cid:
            CID,

        fileHash:
            FILE_HASH,

        plaintextHash:
            PLAINTEXT_HASH,

        fileName:
            "report.pdf",

        mimeType:
            "application/pdf",

        fileSize:
            100,

        category:
            "General",

        emergency:
            false,

        chainId:
            80002,

        contractAddress:
            CONTRACT.toLowerCase(),

        status:
            "prepared",

        expiresAt:
            new Date(Date.now() + 15 * 60 * 1000),

        save:
            jest.fn(),

        ...overrides
    };
}

function createTransaction(overrides: any = {}) {
    const iface =
        new ethers.Interface([
            "function createMedicalRecord(address patient,string ipfsHash,string fileHash,string category,bool emergency)"
        ]);

    const data =
        iface.encodeFunctionData(
            "createMedicalRecord",
            [
                PATIENT,
                CID,
                FILE_HASH,
                "General",
                false
            ]
        );

    return {
        from:
            DOCTOR,

        to:
            CONTRACT,

        data,

        ...overrides
    };
}

function createReceipt(overrides: any = {}) {
    return {
        status:
            1,

        logs:
            [],

        ...overrides
    };
}

describe(
    "MedicalRecordTransactionConfirmationService",
    () => {

        let service:
            MedicalRecordTransactionConfirmationService;

        beforeEach(() => {
            jest.clearAllMocks();

            service =
                new MedicalRecordTransactionConfirmationService(
                    provider,
                    contract
                );

            provider.getNetwork.mockResolvedValue({
                chainId: 80002n
            });

            provider.getBlock.mockResolvedValue({
                timestamp: Math.floor(Date.now() / 1000)
            });
        });

        test(
            "rejects a transaction mined after preparation expiry",
            async () => {

                const preparation =
                    createPreparation({
                        expiresAt:
                            new Date(Date.now() - 1000)
                    });

                preparedModel.findOne.mockResolvedValue(
                    preparation
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt()
                );

                provider.getBlock.mockResolvedValue({
                    timestamp:
                        Math.floor(preparation.expiresAt.getTime() / 1000) + 1
                });

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "Medical record transaction was mined after preparation expiry"
                );

                expect(
                    preparation.save
                ).toHaveBeenCalledTimes(1);

                expect(
                    provider.getTransaction
                ).toHaveBeenCalledTimes(1);
            }
        );

        test(
            "rejects transaction when sender does not match authenticated doctor",
            async () => {

                preparedModel.findOne.mockResolvedValue(
                    createPreparation()
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction({
                        from:
                            OTHER_DOCTOR
                    })
                );

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "Transaction sender does not match authenticated doctor"
                );

                expect(
                    provider.getTransactionReceipt
                ).not.toHaveBeenCalled();

                expect(
                    medicalRecordModel.create
                ).not.toHaveBeenCalled();
            }
        );

        test(
            "rejects transaction sent to the wrong contract",
            async () => {

                preparedModel.findOne.mockResolvedValue(
                    createPreparation()
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction({
                        to:
                            OTHER_DOCTOR
                    })
                );

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "Transaction destination does not match the prepared MedicalRecord contract"
                );

                expect(
                    provider.getTransactionReceipt
                ).not.toHaveBeenCalled();

                expect(
                    medicalRecordModel.create
                ).not.toHaveBeenCalled();
            }
        );

        test(
            "rejects transaction with mismatched calldata",
            async () => {

                const iface =
                    new ethers.Interface([
                        "function createMedicalRecord(address patient,string ipfsHash,string fileHash,string category,bool emergency)"
                    ]);

                const maliciousData =
                    iface.encodeFunctionData(
                        "createMedicalRecord",
                        [
                            OTHER_DOCTOR,
                            CID,
                            FILE_HASH,
                            "General",
                            false
                        ]
                    );

                preparedModel.findOne.mockResolvedValue(
                    createPreparation()
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction({
                        data:
                            maliciousData
                    })
                );

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "Transaction patient does not match preparation"
                );

                expect(
                    provider.getTransactionReceipt
                ).not.toHaveBeenCalled();

                expect(
                    medicalRecordModel.create
                ).not.toHaveBeenCalled();
            }
        );

        test(
            "rejects reverted transaction",
            async () => {

                preparedModel.findOne.mockResolvedValue(
                    createPreparation()
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt({
                        status:
                            0
                    })
                );

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "Medical record blockchain transaction reverted"
                );

                expect(
                    contract.recordExists
                ).not.toHaveBeenCalled();

                expect(
                    medicalRecordModel.create
                ).not.toHaveBeenCalled();
            }
        );

        test(
            "confirms a valid transaction and persists the medical record",
            async () => {

                const preparation =
                    createPreparation();

                preparedModel.findOne.mockResolvedValue(
                    preparation
                );

                preparedModel.findOneAndUpdate.mockResolvedValue({
                    ...preparation,
                    status: "confirmed",
                    transactionHash: TX_HASH,
                    recordId: 42
                });

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                const iface =
                    new ethers.Interface([
                        ...testRequire("../../blockchain/polygon/abi/MedicalRecord.json").abi
                    ]);

                const eventLog =
                    iface.encodeEventLog(
                        iface.getEvent("RecordCreated")!,
                        [
                            42n,
                            PATIENT,
                            DOCTOR,
                            HOSPITAL,
                            "General",
                            1234567890n
                        ]
                    );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt({
                        logs: [
                            {
                                address:
                                    CONTRACT,

                                topics:
                                    eventLog.topics,

                                data:
                                    eventLog.data
                            }
                        ]
                    })
                );

                contract.recordExists.mockResolvedValue(
                    true
                );

                medicalRecordModel.create.mockResolvedValue({
                    recordId:
                        42
                });

                const result =
                    await service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    });

                expect(result).toEqual({
                    preparationId:
                        "prep-123",

                    recordId:
                        42,

                    transactionHash:
                        TX_HASH,

                    doctorWallet:
                        DOCTOR,

                    hospitalWallet:
                        HOSPITAL,

                    patientWallet:
                        PATIENT,

                    cid:
                        CID,

                    fileHash:
                        FILE_HASH,

                    fileName:
                        "report.pdf",

                    mimeType:
                        "application/pdf",

                    fileSize:
                        100,

                    category:
                        "General",

                    emergency:
                        false
                });

                expect(
                    provider.getNetwork
                ).toHaveBeenCalledTimes(1);

                expect(
                    provider.getTransaction
                ).toHaveBeenCalledWith(
                    TX_HASH
                );

                expect(
                    provider.getTransactionReceipt
                ).toHaveBeenCalledWith(
                    TX_HASH
                );

                expect(
                    contract.recordExists
                ).toHaveBeenCalledWith(
                    42
                );

                expect(
                    medicalRecordModel.create
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        recordId:
                            42,

                        patientWallet:
                            PATIENT.toLowerCase(),

                        fileName:
                            "report.pdf",

                        mimeType:
                            "application/pdf",

                        fileSize:
                            100,

                        fileHash:
                            FILE_HASH,

                        plaintextHash:
                            PLAINTEXT_HASH,

                        cid:
                            CID,

                        category:
                            "General",

                        emergency:
                            false,

                        transactionHash:
                            TX_HASH
                    })
                );

                expect(
                    preparedModel.findOneAndUpdate
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        _id:
                            preparation._id,

                        status:
                            "prepared"
                    }),

                    expect.objectContaining({
                        $set:
                            expect.objectContaining({
                                status:
                                    "confirmed",

                                transactionHash:
                                    TX_HASH,

                                recordId:
                                    42
                            })
                    }),

                    { new: true }
                );
            }
        );

        test(
            "accepts duplicate Mongo persistence when the existing record has the same transaction hash",
            async () => {

                const preparation =
                    createPreparation();

                preparedModel.findOne.mockResolvedValue(
                    preparation
                );

                preparedModel.findOneAndUpdate.mockResolvedValue({
                    ...preparation,
                    status: "confirmed",
                    transactionHash: TX_HASH,
                    recordId: 42
                });

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                const iface =
                    new ethers.Interface([
                        ...testRequire("../../blockchain/polygon/abi/MedicalRecord.json").abi
                    ]);

                const eventLog =
                    iface.encodeEventLog(
                        iface.getEvent("RecordCreated")!,
                        [
                            42n,
                            PATIENT,
                            DOCTOR,
                            HOSPITAL,
                            "General",
                            1234567890n
                        ]
                    );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt({
                        logs: [
                            {
                                address:
                                    CONTRACT,

                                topics:
                                    eventLog.topics,

                                data:
                                    eventLog.data
                            }
                        ]
                    })
                );

                contract.recordExists.mockResolvedValue(
                    true
                );

                const duplicateError =
                    Object.assign(
                        new Error(
                            "E11000 duplicate key error"
                        ),
                        {
                            code: 11000
                        }
                    );

                medicalRecordModel.create.mockRejectedValue(
                    duplicateError
                );

                medicalRecordModel.findOne.mockResolvedValue({
                    recordId: 42,
                    transactionHash: TX_HASH
                });

                const result =
                    await service.confirm({
                        preparationId: "prep-123",
                        transactionHash: TX_HASH,
                        doctorWallet: DOCTOR
                    });

                expect(result.recordId).toBe(42);

                expect(
                    medicalRecordModel.create
                ).toHaveBeenCalledTimes(1);

                expect(
                    medicalRecordModel.findOne
                ).toHaveBeenCalledWith({
                    recordId: 42,
                    chainId: 80002,
                    contractAddress: CONTRACT.toLowerCase()
                });

                expect(
                    preparedModel.findOneAndUpdate
                ).toHaveBeenCalledTimes(1);
            }
        );

        test(
            "rejects when preparation finalization loses the confirmation race",
            async () => {

                const preparation =
                    createPreparation();

                preparedModel.findOne.mockResolvedValue(
                    preparation
                );

                preparedModel.findOneAndUpdate.mockResolvedValue(
                    null
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                const iface =
                    new ethers.Interface([
                        ...testRequire("../../blockchain/polygon/abi/MedicalRecord.json").abi
                    ]);

                const eventLog =
                    iface.encodeEventLog(
                        iface.getEvent("RecordCreated")!,
                        [
                            42n,
                            PATIENT,
                            DOCTOR,
                            HOSPITAL,
                            "General",
                            1234567890n
                        ]
                    );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt({
                        logs: [
                            {
                                address:
                                    CONTRACT,

                                topics:
                                    eventLog.topics,

                                data:
                                    eventLog.data
                            }
                        ]
                    })
                );

                contract.recordExists.mockResolvedValue(
                    true
                );

                medicalRecordModel.create.mockResolvedValue({
                    recordId: 42
                });

                await expect(
                    service.confirm({
                        preparationId: "prep-123",
                        transactionHash: TX_HASH,
                        doctorWallet: DOCTOR
                    })
                ).rejects.toThrow(
                    "Medical record was committed but preparation could not be finalized"
                );

                expect(
                    medicalRecordModel.create
                ).toHaveBeenCalledTimes(1);

                expect(
                    preparedModel.findOneAndUpdate
                ).toHaveBeenCalledTimes(1);
            }
        );

        test(
            "rejects successful transaction when RecordCreated event is missing",
            async () => {

                preparedModel.findOne.mockResolvedValue(
                    createPreparation()
                );

                provider.getTransaction.mockResolvedValue(
                    createTransaction()
                );

                provider.getTransactionReceipt.mockResolvedValue(
                    createReceipt()
                );

                await expect(
                    service.confirm({
                        preparationId:
                            "prep-123",

                        transactionHash:
                            TX_HASH,

                        doctorWallet:
                            DOCTOR
                    })
                ).rejects.toThrow(
                    "RecordCreated event was not found in transaction receipt"
                );

                expect(
                    contract.recordExists
                ).not.toHaveBeenCalled();

                expect(
                    medicalRecordModel.create
                ).not.toHaveBeenCalled();
            }
        );
    }
);
