import type {
    IVerifyResult,
    W3CVerifiableCredential,
    W3CVerifiablePresentation,
} from "@veramo/core-types";
import UserModel from "../../models/User";
import type { UserRole } from "../../models/User";
import {
    CareLinkAuthorizedIdentity,
    ICareLinkAuthorizationService,
    VerifiedPresentationContext,
} from "../interfaces/ICareLinkAuthorizationService";
import {
    CARELINK_ROLE_CREDENTIAL_TYPE,
} from "./CareLinkCredentialService";
import issuerPolicy, { CareLinkIssuerPolicy } from "./CareLinkIssuerPolicy";

const SUPPORTED_ROLES: readonly UserRole[] = [
    "Admin",
    "Patient",
    "Doctor",
    "Hospital",
];

export class CareLinkAuthorizationService implements ICareLinkAuthorizationService {
    constructor(
        private readonly trustedIssuerPolicy: CareLinkIssuerPolicy = issuerPolicy
    ) {}

    async authorizeVerifiedPresentation(
        context: VerifiedPresentationContext
    ): Promise<CareLinkAuthorizedIdentity> {
        if (!context?.verification?.verified) {
            throw new Error("Verified presentation is required.");
        }

        const holderDid = this.getHolderDid(context.presentation);
        const credential = this.getCareLinkCredential(
            context.presentation
        );
        const role = this.getCredentialRole(credential, holderDid);
        const issuerDid = this.getIssuerDid(credential);

        if (!this.trustedIssuerPolicy.isTrustedIssuer(issuerDid)) {
            throw new Error("Credential issuer is not trusted.");
        }

        const user = await UserModel.findOne({ did: holderDid });
        if (!user) {
            throw new Error("Holder DID is not mapped to an application user.");
        }

        if (!user.did || user.did !== holderDid) {
            throw new Error("Holder DID does not match the application user DID.");
        }

        if (user.role !== role) {
            throw new Error("Credential role does not match application user role.");
        }

        return {
            userId: user._id.toString(),
            did: holderDid,
            role: user.role,
        };
    }

    private getHolderDid(
        presentation: W3CVerifiablePresentation
    ): string {
        if (
            !presentation ||
            typeof presentation !== "object" ||
            Array.isArray(presentation) ||
            typeof presentation.holder !== "string" ||
            !presentation.holder.trim() ||
            !presentation.holder.trim().startsWith("did:")
        ) {
            throw new Error("Presentation holder DID is required.");
        }

        return presentation.holder.trim();
    }

    private getCareLinkCredential(
        presentation: W3CVerifiablePresentation
    ): W3CVerifiableCredential & Record<string, any> {
        if (
            typeof presentation !== "object" ||
            !Array.isArray(presentation.verifiableCredential)
        ) {
            throw new Error("CareLink credential is required.");
        }

        const credential = presentation.verifiableCredential.find(
            (candidate) =>
                typeof candidate === "object" &&
                candidate !== null &&
                Array.isArray(candidate.type) &&
                candidate.type.includes(CARELINK_ROLE_CREDENTIAL_TYPE)
        );

        if (!credential || typeof credential !== "object") {
            throw new Error("CareLink credential is required.");
        }

        return credential as W3CVerifiableCredential & Record<string, any>;
    }

    private getCredentialRole(
        credential: W3CVerifiableCredential & Record<string, any>,
        holderDid: string
    ): UserRole {
        const subject = credential.credentialSubject;
        const role = subject?.role;

        if (
            !subject ||
            typeof subject !== "object" ||
            typeof subject.id !== "string" ||
            subject.id.trim() !== holderDid ||
            typeof role !== "string" ||
            !SUPPORTED_ROLES.includes(role as UserRole)
        ) {
            throw new Error("Credential subject or role is invalid.");
        }

        return role as UserRole;
    }

    private getIssuerDid(
        credential: W3CVerifiableCredential & Record<string, any>
    ): string {
        const issuer = credential.issuer;
        const issuerDid = typeof issuer === "string" ? issuer : issuer?.id;

        if (
            typeof issuerDid !== "string" ||
            !issuerDid.trim() ||
            !issuerDid.trim().startsWith("did:")
        ) {
            throw new Error("Credential issuer DID is required.");
        }

        return issuerDid.trim();
    }
}

export default new CareLinkAuthorizationService();