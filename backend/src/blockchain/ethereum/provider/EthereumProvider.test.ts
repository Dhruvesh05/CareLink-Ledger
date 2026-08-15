import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const patientServiceMock = {
    registerPatient: jest.fn(),
    getPatient: jest.fn(),
    isPatientActive: jest.fn()
};

const doctorServiceMock = {
    registerDoctor: jest.fn(),
    verifyDoctor: jest.fn(),
    getDoctor: jest.fn(),
    isDoctorActive: jest.fn(),
    isDoctorVerified: jest.fn()
};

const hospitalServiceMock = {
    registerHospital: jest.fn(),
    verifyHospital: jest.fn(),
    getHospital: jest.fn(),
    isHospitalActive: jest.fn(),
    isHospitalVerified: jest.fn()
};

const medicalRecordServiceMock = {
    createMedicalRecord: jest.fn(),
    getMedicalRecord: jest.fn(),
    updateMedicalRecord: jest.fn(),
    deactivateMedicalRecord: jest.fn(),
    grantAccess: jest.fn(),
    revokeAccess: jest.fn(),
    getPatientRecords: jest.fn(),
    getDoctorRecords: jest.fn(),
    getHospitalRecords: jest.fn(),
    viewRecord: jest.fn(),
    logDownload: jest.fn(),
    recordExists: jest.fn(),
    totalRecords: jest.fn()
};

import { EthereumProvider } from "./EthereumProvider";

describe("EthereumProvider adapter", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("delegates patient registration", async () => {
        (patientServiceMock.registerPatient as jest.Mock).mockImplementation(async () => ({ ok: true }));
        const provider = new EthereumProvider() as any;
        provider.patientService = patientServiceMock;

        const result = await provider.registerPatient("n", "d", "A+", "M");

        expect(patientServiceMock.registerPatient).toHaveBeenCalledWith("n", "d", "A+", "M");
        expect(result).toEqual({ ok: true });
    });

    it("delegates doctor/hospital/record reads", async () => {
        (doctorServiceMock.getDoctor as jest.Mock).mockImplementation(async () => ({ id: "d1" }));
        (hospitalServiceMock.getHospital as jest.Mock).mockImplementation(async () => ({ id: "h1" }));
        (medicalRecordServiceMock.getMedicalRecord as jest.Mock).mockImplementation(async () => ({ id: 1 }));

        const provider = new EthereumProvider() as any;
        provider.doctorService = doctorServiceMock;
        provider.hospitalService = hospitalServiceMock;
        provider.medicalRecordService = medicalRecordServiceMock;

        await expect(provider.getDoctor("0x1")).resolves.toEqual({ id: "d1" });
        await expect(provider.getHospital("0x2")).resolves.toEqual({ id: "h1" });
        await expect(provider.getMedicalRecord(1)).resolves.toEqual({ id: 1 });
    });
});