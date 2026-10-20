import {
    AnalyticsClientError,
    type AnalyticsAnalysisResponse,
} from "./AnalyticsClient";
import {
    type AnalyticsUploadClient,
    AnalyticsUploadService,
    type AnalyticsUpload,
} from "./AnalyticsUploadService";

function result(): AnalyticsAnalysisResponse {
    return {
        schema: {},
        mapping: {},
        validation: {},
        fhir: null,
        fhir_bundles: null,
        handoffs: null,
    };
}

describe("AnalyticsUploadService", () => {
    it("forwards the in-memory upload to the Analytics client", async () => {
        const client: AnalyticsUploadClient = {
            analyze: jest.fn().mockResolvedValue(result()),
        };
        const service = new AnalyticsUploadService(client);
        const upload: AnalyticsUpload = {
            buffer: Buffer.from("patient_id\n101\n"),
            originalname: "patients.csv",
            mimetype: "text/csv",
        };

        await expect(service.analyzeUpload(upload)).resolves.toEqual(result());
        expect(client.analyze).toHaveBeenCalledWith(
            upload.buffer,
            "patients.csv",
            "text/csv",
        );
    });

    it("rejects clinical-document formats before making a network call", async () => {
        const client: AnalyticsUploadClient = {
            analyze: jest.fn(),
        };
        const service = new AnalyticsUploadService(client);

        await expect(
            service.analyzeUpload({
                buffer: Buffer.from("pdf"),
                originalname: "record.pdf",
                mimetype: "application/pdf",
            }),
        ).rejects.toMatchObject({
            code: "ANALYTICS_INVALID_UPLOAD",
        } satisfies Partial<AnalyticsClientError>);
        expect(client.analyze).not.toHaveBeenCalled();
    });

    it("preserves client failures for the eventual tabular upload caller", async () => {
        const failure = new AnalyticsClientError(
            "ANALYTICS_TIMEOUT",
            "Analytics service request timed out",
        );
        const client: AnalyticsUploadClient = {
            analyze: jest.fn().mockRejectedValue(failure),
        };
        const service = new AnalyticsUploadService(client);

        await expect(
            service.analyzeUpload({
                buffer: Buffer.from("data"),
                originalname: "patients.json",
            }),
        ).rejects.toBe(failure);
    });
});
