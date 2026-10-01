import type { UserRole } from "../../models/User";

export interface CareLinkRoleCredentialInput {
    userId: string;
    subjectDid: string;
    issuerDid: string;
}

export interface CareLinkRoleCredentialSubject {
    id: string;
    role: UserRole;
}

export interface ICareLinkCredentialService {
    issueRoleCredential(
        input: CareLinkRoleCredentialInput
    ): Promise<Record<string, unknown>>;
}