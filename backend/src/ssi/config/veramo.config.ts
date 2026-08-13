import { env } from "../../config/env";

export interface VeramoConfig {
    readonly database?: string;
    readonly secretKey?: string;
    readonly didNetwork?: string;
}

// `env` currently does not declare SSI-specific keys; cast to `any` to avoid
// TypeScript errors while preserving runtime behavior. Prefer adding these
// properties to `src/config/env.ts` if you want static typing for them.
const envAny = env as any;

export const veramoConfig: VeramoConfig = {
    database: process.env.SSI_DATABASE || envAny.SSI_DATABASE || "ssi.sqlite",
    secretKey: process.env.SSI_SECRET_KEY || envAny.SSI_SECRET_KEY || undefined,
    didNetwork: process.env.DID_NETWORK || envAny.DID_NETWORK || "local"
};

export default veramoConfig;
