import UserModel from "../../models/User";
import type { UserRole } from "../../models/User";
import UserDidService from "../../services/UserDidService";
import {
    ICareLinkCredentialService,
} from "../interfaces/ICareLinkCredentialService";
import type { CareLinkRoleCredentialInput } from "../interfaces/ICareLinkCredentialService";
import CredentialService from "./CredentialService";
import issuerPolicy, { CareLinkIssuerPolicy } from "./CareLinkIssuerPolicy";

export const CARELINK_ROLE_CREDENTIAL_TYPE = "CareLinkRoleCredential";
export const CARELINK_ROLE_CREDENTIAL_TYPES = [
    "VerifiableCredential",
    CARELINK_ROLE_CREDENTIAL_TYPE,
];

const SUPPORTED_ROLES: readonly UserRole[] = [
    "Admin",
    "Patient",
    "Doctor",
    "Hospital",
];

export class CareLinkCredentialService implements ICareLinkCredentialService {
    private readonly userDidService = new UserDidService();

    constructor(
        private readonly trustedIssuerPolicy: CareLinkIssuerPolicy = issuerPolicy
    ) {}

    async issueRoleCredential(
        input: CareLinkRoleCredentialInput
    ): Promise<Record<string, unknown>> {
        this.requireDid(input?.issuerDid, "Issuer DID is required.");
        this.requireDid(input?.subjectDid, "Subject DID is required.");

        if (!this.trustedIssuerPolicy.isTrustedIssuer(input.issuerDid)) {
            throw new Error("Issuer is not trusted for CareLink role credentials.");
        }

        const user = await UserModel.findById(input.userId);
        if (!user) {
            throw new Error("Application user not found.");
        }

        if (!SUPPORTED_ROLES.includes(user.role)) {
            throw new Error(`Unsupported CareLink application role: ${user.role}`);
        }

        const mappedDid = await this.userDidService.getDid(input.userId);
        const subjectDid = input.subjectDid.trim();

        if (mappedDid !== subjectDid) {
            throw new Error("Subject DID does not belong to the application user.");
        }

        return CredentialService.issueCredential(
            input.issuerDid,
            subjectDid,
            { role: user.role },
            CARELINK_ROLE_CREDENTIAL_TYPES
        );
    }

    private requireDid(value: unknown, message: string): asserts value is string {
        if (
            typeof value !== "string" ||
            !value.trim() ||
            !value.trim().startsWith("did:")
        ) {
            throw new Error(message);
        }
    }
}

export default new CareLinkCredentialService();