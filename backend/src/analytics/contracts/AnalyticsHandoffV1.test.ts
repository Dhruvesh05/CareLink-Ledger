import {
  AnalyticsHandoffV1,
  validateAnalyticsHandoffV1,
} from "./AnalyticsHandoffV1";

function validHandoff(): AnalyticsHandoffV1 {
  return {
    contractVersion: "1.0",
    processing: {
      processingId: "proc-1",
      datasetId: "dataset-1",
      datasetName: "patients.csv",
      processedAt: "2026-10-14T13:00:00.000Z",
      status: "FHIR_GENERATED",
      schemaFingerprint: "fingerprint-1",
      schemaVersion: "schema-1",
    },
    validation: {
      validationStatus: "PASSED",
      qualityScore: 100,
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      errorCount: 0,
      warningCount: 0,
      quarantinedRows: 0,
    },
    patient: {
      sourcePatientId: "source-101",
      fhirPatientId: "101",
    },
    artifact: {
      artifactType: "FHIR_R4_BUNDLE",
      bundleId: "bundle-1",
      resourceCount: 2,
      resourceTypes: ["Patient", "Observation"],
      sha256: "a".repeat(64),
      bundle: {
        resourceType: "Bundle",
        id: "bundle-1",
        type: "collection",
        entry: [
          { resource: { resourceType: "Patient", id: "101" } },
          {
            resource: {
              resourceType: "Observation",
              id: "obs-1",
              subject: { reference: "Patient/101" },
            },
          },
        ],
      },
    },
    provenance: {
      sourceFormat: "CSV",
      mappingComplete: true,
    },
  };
}

describe("validateAnalyticsHandoffV1", () => {
  it("accepts a valid handoff", () => {
    expect(validateAnalyticsHandoffV1(validHandoff())).toEqual(
      validHandoff(),
    );
  });

  it.each([
    ["missing required field", () => {
      const value = validHandoff();
      delete (value.processing as Partial<typeof value.processing>).schemaVersion;
      return value;
    }],
    ["incorrect Bundle ID", () => {
      const value = validHandoff();
      value.artifact.bundleId = "wrong";
      return value;
    }],
    ["resource-count mismatch", () => {
      const value = validHandoff();
      value.artifact.resourceCount = 1;
      return value;
    }],
    ["invalid hash", () => {
      const value = validHandoff();
      value.artifact.sha256 = "not-a-hash";
      return value;
    }],
    ["patient mismatch", () => {
      const value = validHandoff();
      value.patient.fhirPatientId = "202";
      return value;
    }],
    ["row-count inconsistency", () => {
      const value = validHandoff();
      value.validation.validRows = 2;
      return value;
    }],
    ["invalid timestamp", () => {
      const value = validHandoff();
      value.processing.processedAt = "not-a-timestamp";
      return value;
    }],
    ["duplicate Patient resource", () => {
      const value = validHandoff();
      value.artifact.resourceCount = 3;
      value.artifact.resourceTypes = ["Patient", "Observation"];
      value.artifact.bundle.entry?.push({
        resource: { resourceType: "Patient", id: "101" },
      });
      return value;
    }],
  ])("rejects %s", (_name, makeInvalid) => {
    expect(() => validateAnalyticsHandoffV1(makeInvalid())).toThrow();
  });
});
