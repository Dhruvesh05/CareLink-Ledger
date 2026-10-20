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
});
