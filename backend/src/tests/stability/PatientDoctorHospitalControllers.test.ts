import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../services/PatientService", () => ({
    PatientService: jest.fn().mockImplementation(() => ({
        registerPatient: jest.fn()
    }))
}));

jest.mock("../../services/DoctorService", () => ({
    DoctorService: jest.fn().mockImplementation(() => ({
        registerDoctor: jest.fn()
    }))
}));

jest.mock("../../services/HospitalService", () => ({
    HospitalService: jest.fn().mockImplementation(() => ({
        registerHospital: jest.fn()
    }))
}));

import { PatientController } from "../../controllers/PatientController";
import { DoctorController } from "../../controllers/DoctorController";
import { HospitalController } from "../../controllers/HospitalController";

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("patient/doctor/hospital validation", () => {
    it("patient register fails on missing fields", async () => {
        const controller = new PatientController();
        const res = createResponseMock();

        await controller.registerPatient({ body: {} } as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("doctor register fails on missing fields", async () => {
        const controller = new DoctorController();
        const res = createResponseMock();

        await controller.registerDoctor({ body: {} } as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("hospital register fails on missing fields", async () => {
        const controller = new HospitalController();
        const res = createResponseMock();

        await controller.registerHospital({ body: {} } as any, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});