import { IAuthorizationService } from "../interfaces/IAuthorizationService";

const ROLE_ACTIONS: Record<string, readonly string[]> = {
    doctor: [
        "read_patient_record",
        "create_clinical_record",
        "update_clinical_record",
    ],
    nurse: [
        "read_patient_record",
        "create_clinical_record",
    ],
    patient: [
        "read_own_record",
    ],
    hospital: [
        "read_patient_record",
    ],
    admin: [
        "read_patient_record",
        "create_clinical_record",
        "update_clinical_record",
        "manage_identity",
        "manage_access",
    ],
};

export class AuthorizationService implements IAuthorizationService {
    async authorize(
        did: string,
        action: string,
        verified: boolean,
        attributes: Record<string, unknown>,
    ): Promise<boolean> {
        if (!did || typeof did !== "string" || !did.trim()) {
            throw new Error("DID is required.");
        }

        if (!action || typeof action !== "string" || !action.trim()) {
            throw new Error("Action is required.");
        }

        if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
            throw new Error("Authorization attributes are required.");
        }

        if (verified !== true) {
            return false;
        }

        const role = attributes.role;
        if (typeof role !== "string") {
            return false;
        }

        return ROLE_ACTIONS[role]?.includes(action) ?? false;
    }
}

export default new AuthorizationService();
