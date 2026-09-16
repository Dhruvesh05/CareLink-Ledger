import { describe, expect, it } from "@jest/globals";
import AuthorizationService from "../services/AuthorizationService";

describe("AuthorizationService", () => {
    const did = "did:key:test-authorization-did";

    it("returns true for a verified doctor reading a patient record", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, { role: "doctor" }),
        ).resolves.toBe(true);
    });

    it("returns true for a verified doctor creating a clinical record", async () => {
        await expect(
            AuthorizationService.authorize(did, "create_clinical_record", true, { role: "doctor" }),
        ).resolves.toBe(true);
    });

    it("denies doctor access to manage_access", async () => {
        await expect(
            AuthorizationService.authorize(did, "manage_access", true, { role: "doctor" }),
        ).resolves.toBe(false);
    });

    it("returns true for a verified nurse reading a patient record", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, { role: "nurse" }),
        ).resolves.toBe(true);
    });

    it("returns true for a verified patient reading their own record", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_own_record", true, { role: "patient" }),
        ).resolves.toBe(true);
    });

    it("denies patient access to update_clinical_record", async () => {
        await expect(
            AuthorizationService.authorize(did, "update_clinical_record", true, { role: "patient" }),
        ).resolves.toBe(false);
    });

    it("returns true for a verified admin managing access", async () => {
        await expect(
            AuthorizationService.authorize(did, "manage_access", true, { role: "admin" }),
        ).resolves.toBe(true);
    });

    it("denies authorization when verification is false", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", false, { role: "doctor" }),
        ).resolves.toBe(false);
        await expect(
            AuthorizationService.authorize(did, "manage_access", false, { role: "admin" }),
        ).resolves.toBe(false);
    });

    it("denies unknown roles", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, { role: "unknown" }),
        ).resolves.toBe(false);
    });

    it("denies unknown actions", async () => {
        await expect(
            AuthorizationService.authorize(did, "unknown_action", true, { role: "doctor" }),
        ).resolves.toBe(false);
    });

    it("throws when DID is missing", async () => {
        await expect(
            AuthorizationService.authorize("", "read_patient_record", true, { role: "doctor" }),
        ).rejects.toThrow("DID is required.");
    });

    it("throws when action is missing", async () => {
        await expect(
            AuthorizationService.authorize(did, "", true, { role: "doctor" }),
        ).rejects.toThrow("Action is required.");
    });

    it("throws when attributes are missing or invalid", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, null as unknown as Record<string, unknown>),
        ).rejects.toThrow("Authorization attributes are required.");
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, "invalid" as unknown as Record<string, unknown>),
        ).rejects.toThrow("Authorization attributes are required.");
    });

    it("throws when attributes is an array", async () => {
        await expect(
            AuthorizationService.authorize(did, "read_patient_record", true, [] as unknown as Record<string, unknown>),
        ).rejects.toThrow("Authorization attributes are required.");
    });

    it("does not use DID as a hard-coded permission mechanism", async () => {
        await expect(
            AuthorizationService.authorize("did:key:first", "read_patient_record", true, { role: "doctor" }),
        ).resolves.toBe(true);
        await expect(
            AuthorizationService.authorize("did:key:second", "read_patient_record", true, { role: "doctor" }),
        ).resolves.toBe(true);
    });
});
