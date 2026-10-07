import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type {
    IVerifyResult,
    VerifiablePresentation,
} from "@veramo/core-types";
import type { UserRole } from "../../models/User";
import { CareLinkIssuerPolicy } from "../services/CareLinkIssuerPolicy";
import { CareLinkAuthorizationService } from "../services/CareLinkAuthorizationService";

type TestUser = {
    _id: { toString: () => string };
    did: string;
    role: UserRole;
};

const mockFindOne = jest.fn() as jest.MockedFunction<
    (filter: { did: string }) => Promise<TestUser | null>
>;

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findOne: (...args: [{ did: string }]) => mockFindOne(...args),
    },
}));

const holderDid = "did:key:holder";
const issuerDid = "did:key:trusted-issuer";

function createPresentation(role: string = "Doctor"): VerifiablePresentation {
    return {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        holder: holderDid,
        verifiableCredential: [{
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential", "CareLinkRoleCredential"],
            issuer: issuerDid,
            issuanceDate: "2026-01-01T00:00:00.000Z",
            credentialSubject: {
                id: holderDid,
                role,
            },
            proof: { type: "JwtProof2020", jwt: "verified" },
        }],
        proof: { type: "JwtProof2020", jwt: "verified" },
    };
}

function verified(): IVerifyResult {
    return { verified: true };
}

describe("CareLinkAuthorizationService", () => {
    const trustedPolicy = {
        isTrustedIssuer: (did: string) => did === issuerDid,
    } as CareLinkIssuerPolicy;
    const service = new CareLinkAuthorizationService(trustedPolicy);

    beforeEach(() => {
        jest.clearAllMocks();
        mockFindOne.mockResolvedValue({
            _id: { toString: () => "user-1" },
            did: holderDid,
            role: "Doctor",
        });
    });

    it("authorizes a verified Doctor credential for a Doctor user", async () => {
        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation("Doctor"),
            verification: verified(),
        })).resolves.toEqual({
            userId: "user-1",
            did: holderDid,
            role: "Doctor",
        });
    });

    it("authorizes a verified Patient credential for a Patient user", async () => {
        mockFindOne.mockResolvedValue({
            _id: { toString: () => "patient-1" },
            did: holderDid,
            role: "Patient",
        });

        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation("Patient"),
            verification: verified(),
        })).resolves.toEqual(expect.objectContaining({ role: "Patient" }));
    });

    it("rejects an unknown holder DID", async () => {
        mockFindOne.mockResolvedValue(null);

        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation(),
            verification: verified(),
        })).rejects.toThrow("not mapped");
    });

    it("rejects a holder DID that differs from the persisted DID", async () => {
        mockFindOne.mockResolvedValue({
            _id: { toString: () => "user-1" },
            did: "did:key:other",
            role: "Doctor",
        });

        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation(),
            verification: verified(),
        })).rejects.toThrow("does not match");
    });

    it("rejects a credential role that differs from the application role", async () => {
        mockFindOne.mockResolvedValue({
            _id: { toString: () => "user-1" },
            did: holderDid,
            role: "Patient",
        });

        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation("Doctor"),
            verification: verified(),
        })).rejects.toThrow("does not match");
    });

    it("rejects unsupported and missing credentials", async () => {
        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation("Nurse"),
            verification: verified(),
        })).rejects.toThrow("invalid");

        await expect(service.authorizeVerifiedPresentation({
            presentation: {
                ...createPresentation(),
                verifiableCredential: [],
            } as VerifiablePresentation,
            verification: verified(),
        })).rejects.toThrow("required");
    });

    it("rejects missing holder DIDs and failed VP verification", async () => {
        await expect(service.authorizeVerifiedPresentation({
            presentation: {
                ...createPresentation(),
                holder: "",
            } as VerifiablePresentation,
            verification: verified(),
        })).rejects.toThrow("holder DID");

        await expect(service.authorizeVerifiedPresentation({
            presentation: createPresentation(),
            verification: { verified: false },
        })).rejects.toThrow("Verified presentation");
        expect(mockFindOne).not.toHaveBeenCalled();
    });

    it("rejects an untrusted credential issuer", async () => {
        await expect(service.authorizeVerifiedPresentation({
            presentation: {
                ...createPresentation(),
                verifiableCredential: [{
                    ...(createPresentation() as any).verifiableCredential[0],
                    issuer: "did:key:untrusted",
                }],
            } as VerifiablePresentation,
            verification: verified(),
        })).rejects.toThrow("not trusted");
        expect(mockFindOne).not.toHaveBeenCalled();
    });
});