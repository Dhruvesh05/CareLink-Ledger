import type { IVerifyResult, W3CVerifiablePresentation } from "@veramo/core-types";
import type { UserRole } from "../../models/User";

export interface CareLinkAuthorizedIdentity {
    userId: string;
    did: string;
    role: UserRole;
}

export interface VerifiedPresentationContext {
    presentation: W3CVerifiablePresentation;
    verification: IVerifyResult;
}

export interface ICareLinkAuthorizationService {
    authorizeVerifiedPresentation(
        context: VerifiedPresentationContext
    ): Promise<CareLinkAuthorizedIdentity>;
}