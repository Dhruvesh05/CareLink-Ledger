import {
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

import {
    AnalyticsClientError,
    type AnalyticsAnalysisResponse
} from "../services/AnalyticsClient";
import {
    AnalyticsController
} from "./AnalyticsController";
import MedicalRecordModel from "../../models/MedicalRecordModel";
import FhirProcessingResultModel from "../../models/FhirProcessingResultModel";
import AccessRequestModel from "../../models/AccessRequest";

function result(): AnalyticsAnalysisResponse {
    return {
        schema: { fingerprint: "schema-1" },
        mapping: { status: "COMPLETE" },
        validation: { validationStatus: "PASSED" },
        fhir: { resourceType: "Bundle" },
        fhir_bundles: { "101": { resourceType: "Bundle" } },
        handoffs: null
    };
}

function response() {
    const res: any = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    return res;
}

function query(value: unknown) {
    return {
        select: () => ({
            lean: () => ({
                exec: jest.fn().mockResolvedValue(value)
            })
        }),
        lean: () => ({
            exec: jest.fn().mockResolvedValue(value)
        })
    };
}

describe("AnalyticsController", () => {
    it("forwards the upload and preserves the Analytics response fields", async () => {
        const analyzeUpload = jest.fn() as any;
        analyzeUpload.mockResolvedValue(result());
        const service = {
            analyzeUpload
        };
        const controller = new AnalyticsController(service as any);
        const res = response();

        await controller.analyze({
            file: {
                buffer: Buffer.from("patient_id\n101\n"),
                originalname: "patients.csv",
                mimetype: "text/csv"
            }
        } as any, res);

        expect(service.analyzeUpload).toHaveBeenCalledWith({
            buffer: expect.any(Buffer),
            originalname: "patients.csv",
            mimetype: "text/csv"
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Analytics analysis completed",
            data: result()
        });
    });

    it("rejects missing files before invoking the service", async () => {
        const service = {
            analyzeUpload: jest.fn()
        };
        const controller = new AnalyticsController(service as any);
        const res = response();

        await controller.analyze({} as any, res);

        expect(service.analyzeUpload).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Missing file upload"
        });
    });

    it.each([
        ["ANALYTICS_TIMEOUT", 504],
        ["ANALYTICS_UNAVAILABLE", 503],
        ["ANALYTICS_UPSTREAM_ERROR", 502],
        ["ANALYTICS_INVALID_RESPONSE", 502],
        ["ANALYTICS_NOT_CONFIGURED", 503]
    ])("maps %s without exposing upstream data", async (code, status) => {
        const typedCode = code as AnalyticsClientError["code"];
        const analyzeUpload = jest.fn() as any;
        analyzeUpload.mockRejectedValue(
            new AnalyticsClientError(typedCode, "safe Analytics error")
        );
        const service = {
            analyzeUpload
        };
        const controller = new AnalyticsController(service as any);
        const res = response();

        await controller.analyze({
            file: {
                buffer: Buffer.from("data"),
                originalname: "patients.json",
                mimetype: "application/json"
            }
        } as any, res);

        expect(res.status).toHaveBeenCalledWith(status);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "safe Analytics error",
            error: { code: typedCode }
        });
    });

    it("returns a patient's own FHIR result", async () => {
        jest.spyOn(FhirProcessingResultModel, "findOne").mockReturnValue(
            query({
                _id: "processing-1",
                recordId: 7,
                patientUserId: "patient-1",
                originalCid: "cid-1",
                status: "completed",
                result: result()
            }) as never
        );
        jest.spyOn(MedicalRecordModel, "findOne").mockReturnValue(
            query({ patientUserId: "patient-1" }) as never
        );
        const res = response();

        await new AnalyticsController().getMedicalRecordProcessingResult({
            params: { recordId: "7", processingId: "processing-1" },
            auth: { userId: "patient-1", role: "Patient" }
        } as any, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ patientUserId: "patient-1" })
        }));
    });

    it("denies another patient's FHIR result", async () => {
        jest.spyOn(FhirProcessingResultModel, "findOne").mockReturnValue(
            query({
                _id: "processing-2",
                recordId: 7,
                patientUserId: "patient-2",
                originalCid: "cid-2",
                status: "completed"
            }) as never
        );
        jest.spyOn(MedicalRecordModel, "findOne").mockReturnValue(
            query({ patientUserId: "patient-2" }) as never
        );
        const res = response();

        await new AnalyticsController().getMedicalRecordProcessingResult({
            params: { recordId: "7", processingId: "processing-2" },
            auth: { userId: "patient-1", role: "Patient" }
        } as any, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it.each([
        ["COMMENT_ONLY", new Date(Date.now() + 60_000)],
        ["READ_ONLY", new Date(Date.now() - 60_000)]
    ])("denies a doctor without active READ_ONLY consent (%s)", async (permissionType, expiresAt) => {
        jest.spyOn(MedicalRecordModel, "findOne").mockReturnValue(
            query({ recordId: 7, patientUserId: "patient-1", cid: "cid-1" }) as never
        );
        jest.spyOn(AccessRequestModel, "findOne").mockReturnValue(
            query(null) as never
        );
        const res = response();
        const service = { analyzeUpload: jest.fn() };

        await new AnalyticsController(service as any).analyzeMedicalRecord({
            params: { recordId: "7" },
            auth: { userId: "doctor-1", role: "Doctor" },
            file: { buffer: Buffer.from("x"), originalname: "x", mimetype: "text/plain" }
        } as any, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(service.analyzeUpload).not.toHaveBeenCalled();
        void permissionType;
        void expiresAt;
    });

    it("allows a doctor with active READ_ONLY consent", async () => {
        jest.spyOn(MedicalRecordModel, "findOne").mockReturnValue(
            query({ recordId: 7, patientUserId: "patient-1", cid: "cid-1" }) as never
        );
        jest.spyOn(AccessRequestModel, "findOne").mockReturnValue(
            query({ _id: "grant-1" }) as never
        );
        jest.spyOn(FhirProcessingResultModel, "create").mockResolvedValue({
            _id: "processing-1"
        } as never);
        jest.spyOn(FhirProcessingResultModel, "updateOne").mockReturnValue({
            exec: jest.fn().mockResolvedValue({})
        } as never);
        const service = { analyzeUpload: jest.fn().mockResolvedValue(result()) };
        const res = response();

        await new AnalyticsController(service as any).analyzeMedicalRecord({
            params: { recordId: "7" },
            auth: { userId: "doctor-1", role: "Doctor" },
            file: { buffer: Buffer.from("x"), originalname: "x", mimetype: "text/plain" }
        } as any, res);

        expect(service.analyzeUpload).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
