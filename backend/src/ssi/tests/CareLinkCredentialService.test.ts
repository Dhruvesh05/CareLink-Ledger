import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type TestUser = {
    role: string;
};

type TestCredential = {
    type: string[];
    credentialSubject: {
        id: string;
        role: string;
    };
};

const mockFindById = jest.fn() as jest.MockedFunction<
    (userId: string) => Promise<TestUser | null>
>;

const mockGetDid = jest.fn() as jest.MockedFunction<
    (userId: string) => Promise<string>
>;

const mockIssueCredential = jest.fn() as jest.MockedFunction<
    (
        issuerDid: string,
        subjectDid: string,
        credentialSubject: Record<string, unknown>,
        credentialTypes?: string[]
    ) => Promise<TestCredential>
>;

jest.mock("../../config/env", () => ({
    env: {
        CARELINK_ISSUER_DID: "did:key:carelink-issuer",
    },
}));

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: { findById: mockFindById },
}));

jest.mock("../../services/UserDidService", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getDid: mockGetDid,
    })),
}));

jest.mock("../services/CredentialService", () => ({
    __esModule: true,
    default: { issueCredential: mockIssueCredential },
}));

import {
    CARELINK_ROLE_CREDENTIAL_TYPE,
    CARELINK_ROLE_CREDENTIAL_TYPES,
    CareLinkCredentialService,
} from "../services/CareLinkCredentialService";

describe("CareLinkCredentialService", () => {
    const service = new CareLinkCredentialService();
    const input = {
        userId: "user-1",
        subjectDid: "did:key:user-1",
        issuerDid: "did:key:carelink-issuer",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFindById.mockResolvedValue({ role: "Doctor" });
        mockGetDid.mockResolvedValue(input.subjectDid);
        mockIssueCredential.mockResolvedValue({
            type: CARELINK_ROLE_CREDENTIAL_TYPES,
            credentialSubject: { id: input.subjectDid, role: "Doctor" },
        });
    });

    it("creates a CareLink role credential for the mapped user DID", async () => {
        const credential = await service.issueRoleCredential(input);

        expect(credential).toEqual(expect.objectContaining({
            type: CARELINK_ROLE_CREDENTIAL_TYPES,
        }));
        expect(mockIssueCredential).toHaveBeenCalledWith(
            input.issuerDid,
            input.subjectDid,
            { role: "Doctor" },
            CARELINK_ROLE_CREDENTIAL_TYPES
        );
    });

    it("uses the CareLink credential type and does not include medical data", async () => {
        await service.issueRoleCredential(input);

        const subject = mockIssueCredential.mock.calls[0][2];
        expect(subject).toEqual({ role: "Doctor" });
        expect(CARELINK_ROLE_CREDENTIAL_TYPE).toBe("CareLinkRoleCredential");
    });

    it("accepts the configured trusted issuer", async () => {
        await expect(service.issueRoleCredential(input)).resolves.toBeDefined();
    });

    it("rejects an unauthorized issuer", async () => {
        await expect(service.issueRoleCredential({
            ...input,
            issuerDid: "did:key:untrusted",
        })).rejects.toThrow("Issuer is not trusted");
        expect(mockFindById).not.toHaveBeenCalled();
    });

    it("rejects an unsupported application role", async () => {
        mockFindById.mockResolvedValue({ role: "Nurse" });

        await expect(service.issueRoleCredential(input)).rejects.toThrow(
            "Unsupported CareLink application role"
        );
        expect(mockIssueCredential).not.toHaveBeenCalled();
    });

    it("rejects a malformed or missing subject DID", async () => {
        await expect(service.issueRoleCredential({
            ...input,
            subjectDid: "not-a-did",
        })).rejects.toThrow("Subject DID is required");

        await expect(service.issueRoleCredential({
            ...input,
            subjectDid: "",
        })).rejects.toThrow("Subject DID is required");
    });

    it("rejects a subject DID that is not mapped to the application user", async () => {
        mockGetDid.mockResolvedValue("did:key:another-user");

        await expect(service.issueRoleCredential(input)).rejects.toThrow(
            "Subject DID does not belong to the application user"
        );
    });
});