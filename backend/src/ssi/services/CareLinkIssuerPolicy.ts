import { env } from "../../config/env";

export class CareLinkIssuerPolicy {
    isTrustedIssuer(issuerDid: string): boolean {
        return Boolean(
            issuerDid &&
            typeof issuerDid === "string" &&
            env.CARELINK_ISSUER_DID &&
            issuerDid.trim() === env.CARELINK_ISSUER_DID
        );
    }
}

export default new CareLinkIssuerPolicy();