import { env } from "../../config/env";

export interface VeramoConfig {
    readonly database?: string;
    readonly secretKey?: string;
    readonly didNetwork?: string;
}

/**
 * Environment configuration for the Veramo SSI layer.
 *
 * Production deployments should always provide SSI_SECRET_KEY
 * through environment variables.
 *
 * A deterministic development/test fallback is provided so that
 * unit tests can run without requiring a real secret in the
 * environment.
 */
const envAny = env as Record<string, unknown>;

const configuredSecretKey =
    process.env.SSI_SECRET_KEY ||
    (typeof envAny.SSI_SECRET_KEY === "string"
        ? envAny.SSI_SECRET_KEY
        : undefined);

const configuredDatabase =
    process.env.SSI_DATABASE ||
    (typeof envAny.SSI_DATABASE === "string"
        ? envAny.SSI_DATABASE
        : undefined);

const configuredDidNetwork =
    process.env.DID_NETWORK ||
    (typeof envAny.DID_NETWORK === "string"
        ? envAny.DID_NETWORK
        : undefined);

export const veramoConfig: VeramoConfig = {
    database: configuredDatabase || "ssi.sqlite",

    /*
     * Never use this fallback for production.
     * SSI_SECRET_KEY should be configured through the environment.
     */
    secretKey:
        configuredSecretKey ||
        "test-only-ssi-secret-key-change-in-production-32bytes",

    didNetwork: configuredDidNetwork || "local"
};

export default veramoConfig;