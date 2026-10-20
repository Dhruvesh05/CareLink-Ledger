import axios, {
    AxiosError,
    type AxiosInstance,
} from "axios";

import { env } from "../../config/env";
import {
    validateAnalyticsHandoffV1,
    type AnalyticsHandoffV1,
} from "../contracts/AnalyticsHandoffV1";

export interface AnalyticsAnalysisResponse {
    schema: Record<string, unknown>;
    mapping: Record<string, unknown>;
    validation: Record<string, unknown>;
    fhir: Record<string, unknown> | null;
    fhir_bundles: Record<string, unknown> | null;
    handoffs: Record<string, AnalyticsHandoffV1> | null;
}

export interface AnalyticsClientConfig {
    readonly baseUrl: string;
    readonly timeoutMs: number;
}

export type AnalyticsClientErrorCode =
    | "ANALYTICS_NOT_CONFIGURED"
    | "ANALYTICS_INVALID_UPLOAD"
    | "ANALYTICS_UNAVAILABLE"
    | "ANALYTICS_TIMEOUT"
    | "ANALYTICS_UPSTREAM_ERROR"
    | "ANALYTICS_INVALID_RESPONSE";

export class AnalyticsClientError extends Error {
    readonly code: AnalyticsClientErrorCode;
    readonly status?: number;

    constructor(
        code: AnalyticsClientErrorCode,
        message: string,
        status?: number,
    ) {
        super(message);
        this.name = "AnalyticsClientError";
        this.code = code;
        this.status = status;
    }
}

const defaultConfig: AnalyticsClientConfig = {
    baseUrl: env.ANALYTICS_BASE_URL,
    timeoutMs: env.ANALYTICS_TIMEOUT_MS,
};

export class AnalyticsClient {
    private readonly config: AnalyticsClientConfig;
    private readonly http: AxiosInstance;

    constructor(
        config: AnalyticsClientConfig = defaultConfig,
        http: AxiosInstance = axios,
    ) {
        this.config = config;
        this.http = http;
    }

    async analyze(
        file: Buffer,
        fileName: string,
        mimeType = "application/octet-stream",
    ): Promise<AnalyticsAnalysisResponse> {
        if (!this.config.baseUrl.trim()) {
            throw new AnalyticsClientError(
                "ANALYTICS_NOT_CONFIGURED",
                "Analytics service URL is not configured",
            );
        }

        if (!Buffer.isBuffer(file) || file.length === 0) {
            throw new AnalyticsClientError(
                "ANALYTICS_INVALID_UPLOAD",
                "Analytics upload must contain a non-empty file",
            );
        }

        const form = new FormData();
        form.append(
            "file",
            new Blob([new Uint8Array(file)], { type: mimeType }),
            fileName,
        );

        let response;
        try {
            response = await this.http.post<unknown>(
                `${this.config.baseUrl.replace(/\/+$/, "")}/analytics/analyze`,
                form,
                {
                    timeout: this.config.timeoutMs,
                },
            );
        } catch (error) {
            throw this.mapRequestError(error);
        }

        return this.parseResponse(response.data);
    }

    private parseResponse(value: unknown): AnalyticsAnalysisResponse {
        if (!isRecord(value)) {
            throw new AnalyticsClientError(
                "ANALYTICS_INVALID_RESPONSE",
                "Analytics service returned a non-object response",
            );
        }

        for (const field of [
            "schema",
            "mapping",
            "validation",
        ]) {
            if (!isRecord(value[field])) {
                throw new AnalyticsClientError(
                    "ANALYTICS_INVALID_RESPONSE",
                    `Analytics response field '${field}' is invalid`,
                );
            }
        }

        if (
            value.fhir !== null &&
            !isRecord(value.fhir)
        ) {
            throw new AnalyticsClientError(
                "ANALYTICS_INVALID_RESPONSE",
                "Analytics response field 'fhir' is invalid",
            );
        }

        if (
            value.fhir_bundles !== null &&
            !isRecord(value.fhir_bundles)
        ) {
            throw new AnalyticsClientError(
                "ANALYTICS_INVALID_RESPONSE",
                "Analytics response field 'fhir_bundles' is invalid",
            );
        }

        let handoffs: Record<string, AnalyticsHandoffV1> | null = null;
        if (value.handoffs !== null) {
            if (!isRecord(value.handoffs)) {
                throw new AnalyticsClientError(
                    "ANALYTICS_INVALID_RESPONSE",
                    "Analytics response field 'handoffs' is invalid",
                );
            }

            handoffs = {};
            for (const [patientId, handoff] of Object.entries(value.handoffs)) {
                try {
                    handoffs[patientId] = validateAnalyticsHandoffV1(handoff);
                } catch {
                    throw new AnalyticsClientError(
                        "ANALYTICS_INVALID_RESPONSE",
                        "Analytics response contains an invalid patient handoff",
                    );
                }
            }
        }

        return {
            schema: value.schema,
            mapping: value.mapping,
            validation: value.validation,
            fhir: value.fhir,
            fhir_bundles: value.fhir_bundles,
            handoffs,
        };
    }

    private mapRequestError(error: unknown): AnalyticsClientError {
        if (!isAxiosError(error)) {
            return new AnalyticsClientError(
                "ANALYTICS_UNAVAILABLE",
                "Analytics service request failed",
            );
        }

        if (
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT"
        ) {
            return new AnalyticsClientError(
                "ANALYTICS_TIMEOUT",
                "Analytics service request timed out",
            );
        }

        if (error.response) {
            return new AnalyticsClientError(
                "ANALYTICS_UPSTREAM_ERROR",
                `Analytics service returned HTTP ${error.response.status}`,
                error.response.status,
            );
        }

        return new AnalyticsClientError(
            "ANALYTICS_UNAVAILABLE",
            "Analytics service is unavailable",
        );
    }
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
}

export default AnalyticsClient;
