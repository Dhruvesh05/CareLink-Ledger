import type { AxiosInstance } from "axios";

import {
    AnalyticsClient,
    AnalyticsClientError,
} from "./AnalyticsClient";

function validHandoff() {
    return {
        contractVersion: "1.0",
        processing: {
            processingId: "proc-1",
            datasetId: "dataset-1",
            datasetName: "patients.csv",
            processedAt: "2026-10-14T13:00:00.000Z",
            status: "FHIR_GENERATED",
            schemaFingerprint: "fingerprint-1",
            schemaVersion: "schema-1",
        },
        validation: {
            validationStatus: "PASSED",
            qualityScore: 100,
            totalRows: 1,
            validRows: 1,
            invalidRows: 0,
            errorCount: 0,
            warningCount: 0,
            quarantinedRows: 0,
        },
        patient: {
            sourcePatientId: "source-101",
            fhirPatientId: "101",
        },
        artifact: {
            artifactType: "FHIR_R4_BUNDLE",
            bundleId: "bundle-1",
            resourceCount: 1,
            resourceTypes: ["Patient"],
            sha256: "a".repeat(64),
            bundle: {
                resourceType: "Bundle",
                id: "bundle-1",
                type: "collection",
                entry: [
                    { resource: { resourceType: "Patient", id: "101" } },
                ],
            },
        },
        provenance: {
            sourceFormat: "CSV",
            mappingComplete: true,
        },
    };
}

function response(handoffs: unknown = { "101": validHandoff() }) {
    return {
        schema: { fingerprint: "fingerprint-1" },
        mapping: { mapping_count: 1 },
        validation: { is_valid: true },
        fhir: { resourceType: "Bundle" },
        fhir_bundles: { "101": { resourceType: "Bundle" } },
        handoffs,
    };
}

function mockHttp(
    result: Promise<unknown>,
): AxiosInstance {
    return {
        post: jest.fn().mockReturnValue(result),
    } as unknown as AxiosInstance;
}

describe("AnalyticsClient", () => {
    const config = {
        baseUrl: "http://analytics.internal",
        timeoutMs: 2500,
    };

    it("uploads a file, preserves response fields, and validates handoffs", async () => {
        const http = mockHttp(Promise.resolve({ data: response() }));
        const client = new AnalyticsClient(config, http);

        const result = await client.analyze(
            Buffer.from("patient_id\n101\n"),
            "patients.csv",
            "text/csv",
        );

        expect(result.schema).toEqual(response().schema);
        expect(result.fhir_bundles).toEqual(response().fhir_bundles);
        expect(result.handoffs?.["101"].contractVersion).toBe("1.0");
        expect(http.post).toHaveBeenCalledWith(
            "http://analytics.internal/analytics/analyze",
            expect.any(FormData),
            { timeout: 2500 },
        );
    });

    it("rejects malformed handoffs and unsupported contract versions", async () => {
        const malformed = validHandoff();
        malformed.contractVersion = "2.0";
        const http = mockHttp(Promise.resolve({
            data: response({ "101": malformed }),
        }));

        await expect(
            new AnalyticsClient(config, http).analyze(
                Buffer.from("data"),
                "patients.csv",
            ),
        ).rejects.toMatchObject({
            code: "ANALYTICS_INVALID_RESPONSE",
        });
    });

    it("rejects malformed response structures", async () => {
        const http = mockHttp(Promise.resolve({
            data: { schema: {}, mapping: {}, validation: {} },
        }));

        await expect(
            new AnalyticsClient(config, http).analyze(
                Buffer.from("data"),
                "patients.csv",
            ),
        ).rejects.toMatchObject({
            code: "ANALYTICS_INVALID_RESPONSE",
        });
    });

    it("rejects responses missing handoffs", async () => {
        const http = mockHttp(Promise.resolve({
            data: {
                schema: {},
                mapping: {},
                validation: {},
                fhir: null,
                fhir_bundles: null,
            },
        }));

        await expect(
            new AnalyticsClient(config, http).analyze(
                Buffer.from("data"),
                "patients.csv",
            ),
        ).rejects.toMatchObject({
            code: "ANALYTICS_INVALID_RESPONSE",
        });
    });

    it("maps unavailable, timeout, and upstream HTTP failures", async () => {
        for (const [error, code] of [
            [new Error("connect refused"), "ANALYTICS_UNAVAILABLE"],
            [{ isAxiosError: true, code: "ECONNABORTED" }, "ANALYTICS_TIMEOUT"],
            [{
                isAxiosError: true,
                response: { status: 503 },
            }, "ANALYTICS_UPSTREAM_ERROR"],
        ] as const) {
            const http = mockHttp(Promise.reject(error));

            await expect(
                new AnalyticsClient(config, http).analyze(
                    Buffer.from("data"),
                    "patients.csv",
                ),
            ).rejects.toMatchObject({ code });
        }
    });

    it("fails clearly when the service is not configured", async () => {
        await expect(
            new AnalyticsClient({
                baseUrl: "",
                timeoutMs: 2500,
            }).analyze(Buffer.from("data"), "patients.csv"),
        ).rejects.toMatchObject({
            code: "ANALYTICS_NOT_CONFIGURED",
        } satisfies Partial<AnalyticsClientError>);
    });
});
