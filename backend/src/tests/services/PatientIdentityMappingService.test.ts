
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Wallet } from "ethers";

import PatientIdentityMappingModel from "../../models/PatientIdentityMappingModel";
import UserModel from "../../models/User.ts";
import { PatientIdentityMappingService } from "../../services/PatientIdentityMappingService";

jest.mock("../../models/User.ts", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("../../models/PatientIdentityMappingModel", () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        findOne: jest.fn(),
    },
}));

/**
 * Explicit mock type for model methods.
 * This avoids TypeScript inferring mock return values as `never`.
 */
type TestMock = {
    (...args: any[]): any;
    mock: {
        calls: any[][];
        results: any[];
    };
    mockClear: () => TestMock;
    mockReset: () => TestMock;
    mockImplementation: (fn: (...args: any[]) => any) => TestMock;
    mockResolvedValueOnce: (value: any) => TestMock;
    mockRejectedValue: (value: any) => TestMock;
    mockReturnValueOnce: (value: any) => TestMock;
};

describe("PatientIdentityMappingService", () => {
    let service: PatientIdentityMappingService;

    const hospital = Wallet.createRandom();
    const patient = Wallet.createRandom();

    const makeMessage = () =>
        JSON.stringify({
            purpose: "CareLink Ledger patient identity mapping",
            version: "1",
            hospitalWallet: hospital.address.toLowerCase(),
            sourcePatientId: "source-101",
            fhirPatientId: "101",
            patientWallet: patient.address.toLowerCase(),
        });

    const makeInput = async () => ({
        hospitalWallet: hospital.address,
        sourcePatientId: "source-101",
        fhirPatientId: "101",
        patientWallet: patient.address,
        patientSignature: await patient.signMessage(makeMessage()),
    });

    const mockUserFindOne = () =>
        UserModel.findOne as unknown as TestMock;

    const mockMappingCreate = () =>
        PatientIdentityMappingModel.create as unknown as TestMock;

    const mockMappingFindOne = () =>
        PatientIdentityMappingModel.findOne as unknown as TestMock;

    beforeEach(() => {
        jest.resetAllMocks();
        service = new PatientIdentityMappingService();
    });

    describe("createMapping", () => {
        it("rejects an invalid patient signature before database access", async () => {
            const input = await makeInput();

            await expect(
                service.createMapping({
                    ...input,
                    patientSignature: "invalid-signature",
                }),
            ).rejects.toThrow(
                "Invalid patient identity verification signature",
            );

            expect(mockUserFindOne()).not.toHaveBeenCalled();
            expect(mockMappingCreate()).not.toHaveBeenCalled();
        });

        it("rejects a signature from a different wallet", async () => {
            const input = await makeInput();
            const otherWallet = Wallet.createRandom();

            await expect(
                service.createMapping({
                    ...input,
                    patientSignature: await otherWallet.signMessage(
                        makeMessage(),
                    ),
                }),
            ).rejects.toThrow(
                "Patient signature does not match the registered patient wallet",
            );

            expect(mockUserFindOne()).not.toHaveBeenCalled();
            expect(mockMappingCreate()).not.toHaveBeenCalled();
        });

        it("rejects an invalid hospital wallet", async () => {
            const input = await makeInput();

            await expect(
                service.createMapping({
                    ...input,
                    hospitalWallet: "not-a-wallet",
                }),
            ).rejects.toThrow("Invalid hospitalWallet");

            expect(mockUserFindOne()).not.toHaveBeenCalled();
            expect(mockMappingCreate()).not.toHaveBeenCalled();
        });

        it("creates a mapping for active Hospital and Patient accounts", async () => {
            const input = await makeInput();

            mockUserFindOne()
                .mockResolvedValueOnce({
                    walletAddress: hospital.address.toLowerCase(),
                    role: "Hospital",
                    active: true,
                })
                .mockResolvedValueOnce({
                    walletAddress: patient.address.toLowerCase(),
                    role: "Patient",
                    active: true,
                });

            mockMappingCreate().mockImplementation(
                async (mapping: Record<string, unknown>) => mapping,
            );

            const result = await service.createMapping(input);

            expect(result).toEqual({
                hospitalWallet: hospital.address.toLowerCase(),
                sourcePatientId: input.sourcePatientId,
                fhirPatientId: input.fhirPatientId,
                patientWallet: patient.address.toLowerCase(),
                verifiedByWallet: hospital.address.toLowerCase(),
                verifiedAt: expect.any(Date),
                active: true,
            });

            expect(mockUserFindOne()).toHaveBeenNthCalledWith(1, {
                walletAddress: hospital.address.toLowerCase(),
                role: "Hospital",
                active: true,
            });

            expect(mockUserFindOne()).toHaveBeenNthCalledWith(2, {
                walletAddress: patient.address.toLowerCase(),
                role: "Patient",
                active: true,
            });

            expect(mockMappingCreate()).toHaveBeenCalledWith(
                expect.objectContaining({
                    hospitalWallet: hospital.address.toLowerCase(),
                    sourcePatientId: "source-101",
                    fhirPatientId: "101",
                    patientWallet: patient.address.toLowerCase(),
                    verifiedByWallet: hospital.address.toLowerCase(),
                    active: true,
                    verifiedAt: expect.any(Date),
                }),
            );
        });

        it("rejects a mapping when the hospital account is not active", async () => {
            mockUserFindOne().mockResolvedValueOnce(null);

            await expect(
                service.createMapping(await makeInput()),
            ).rejects.toThrow(
                "An active CareLink Hospital account is required",
            );

            expect(mockUserFindOne()).toHaveBeenCalledTimes(1);
            expect(mockMappingCreate()).not.toHaveBeenCalled();
        });

        it("rejects a mapping when the patient account is not active", async () => {
            mockUserFindOne()
                .mockResolvedValueOnce({
                    walletAddress: hospital.address.toLowerCase(),
                    role: "Hospital",
                    active: true,
                })
                .mockResolvedValueOnce(null);

            await expect(
                service.createMapping(await makeInput()),
            ).rejects.toThrow(
                "An active CareLink Patient account is required",
            );

            expect(mockUserFindOne()).toHaveBeenCalledTimes(2);
            expect(mockMappingCreate()).not.toHaveBeenCalled();
        });

        it("rejects duplicate mappings", async () => {
            mockUserFindOne()
                .mockResolvedValueOnce({
                    walletAddress: hospital.address.toLowerCase(),
                    role: "Hospital",
                    active: true,
                })
                .mockResolvedValueOnce({
                    walletAddress: patient.address.toLowerCase(),
                    role: "Patient",
                    active: true,
                });

            mockMappingCreate().mockRejectedValue({ code: 11000 });

            await expect(
                service.createMapping(await makeInput()),
            ).rejects.toThrow(
                "A mapping already exists for this hospital patient identity",
            );
        });
    });

    describe("resolvePatientWallet", () => {
        it("resolves an active mapping to the registered patient wallet", async () => {
            mockMappingFindOne().mockResolvedValueOnce({
                patientWallet: patient.address.toLowerCase(),
            });

            mockUserFindOne().mockResolvedValueOnce({
                walletAddress: patient.address.toLowerCase(),
                role: "Patient",
                active: true,
            });

            await expect(
                service.resolvePatientWallet(
                    hospital.address,
                    "source-101",
                    "101",
                ),
            ).resolves.toBe(patient.address);

            expect(mockMappingFindOne()).toHaveBeenCalledWith({
                hospitalWallet: hospital.address.toLowerCase(),
                sourcePatientId: "source-101",
                fhirPatientId: "101",
                active: true,
            });

            expect(mockUserFindOne()).toHaveBeenCalledWith({
                walletAddress: patient.address.toLowerCase(),
                role: "Patient",
                active: true,
            });
        });

        it("rejects an unknown mapping", async () => {
            mockMappingFindOne().mockResolvedValueOnce(null);

            await expect(
                service.resolvePatientWallet(
                    hospital.address,
                    "unknown-source",
                    "unknown-fhir",
                ),
            ).rejects.toThrow(
                "No active patient identity mapping exists for this FHIR patient",
            );

            expect(mockUserFindOne()).not.toHaveBeenCalled();
        });

        it("rejects a mapping whose patient account is inactive", async () => {
            mockMappingFindOne().mockResolvedValueOnce({
                patientWallet: patient.address.toLowerCase(),
            });

            mockUserFindOne().mockResolvedValueOnce(null);

            await expect(
                service.resolvePatientWallet(
                    hospital.address,
                    "source-101",
                    "101",
                ),
            ).rejects.toThrow(
                "The mapped CareLink Patient account is missing or inactive",
            );
        });
    });
});
