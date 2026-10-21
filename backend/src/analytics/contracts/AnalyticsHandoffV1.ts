/**
 * Version 1 contract for transferring patient-level FHIR artifacts
 * from the Analytics Layer to the backend.
 */

export type SourceFormat = "CSV" | "XLSX" | "XLS" | "JSON";

export interface ProcessingInfo {
  processingId: string;
  datasetId: string;
  datasetName: string;
  processedAt: string;
  status: "FHIR_GENERATED";
  schemaFingerprint: string;
  schemaVersion: string;
}

export interface ValidationInfo {
  validationStatus: "PASSED";
  qualityScore: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorCount: number;
  warningCount: number;
  quarantinedRows: number;
}

export interface PatientInfo {
  sourcePatientId: string;
  fhirPatientId: string;
}

export interface FhirBundleEntry {
  resource: {
    resourceType: string;
    id?: string;
    [key: string]: unknown;
  };
}

export interface FhirR4Bundle {
  resourceType: "Bundle";
  id: string;
  type: string;
  entry?: FhirBundleEntry[];
  [key: string]: unknown;
}

export interface ArtifactInfo {
  artifactType: "FHIR_R4_BUNDLE";
  bundleId: string;
  resourceCount: number;
  resourceTypes: string[];
  sha256: string;
  bundle: FhirR4Bundle;
}

export interface ProvenanceInfo {
  sourceFormat: SourceFormat;
  mappingComplete: boolean;
}

export interface AnalyticsHandoffV1 {
  contractVersion: "1.0";
  processing: ProcessingInfo;
  validation: ValidationInfo;
  patient: PatientInfo;
  artifact: ArtifactInfo;
  provenance: ProvenanceInfo;
}

/**
 * Runtime validation for data received across the Python/TypeScript boundary.
 * TypeScript interfaces alone do not validate incoming JSON.
 */
export function validateAnalyticsHandoffV1(
  value: unknown,
): AnalyticsHandoffV1 {
  if (!isRecord(value)) {
    throw new Error("Handoff must be an object");
  }

  if (value.contractVersion !== "1.0") {
    throw new Error("Unsupported contractVersion");
  }

  const processing = requireRecord(value.processing, "processing");
  const validation = requireRecord(value.validation, "validation");
  const patient = requireRecord(value.patient, "patient");
  const artifact = requireRecord(value.artifact, "artifact");
  const provenance = requireRecord(value.provenance, "provenance");

  requireNonEmptyString(processing.processingId, "processing.processingId");
  requireNonEmptyString(processing.datasetId, "processing.datasetId");
  requireNonEmptyString(processing.datasetName, "processing.datasetName");
  requireIsoTimestamp(processing.processedAt, "processing.processedAt");
  requireNonEmptyString(
    processing.schemaFingerprint,
    "processing.schemaFingerprint",
  );
  requireNonEmptyString(processing.schemaVersion, "processing.schemaVersion");

  if (processing.status !== "FHIR_GENERATED") {
    throw new Error("processing.status must be FHIR_GENERATED");
  }

  if (validation.validationStatus !== "PASSED") {
    throw new Error("validation.validationStatus must be PASSED");
  }

  requireNumberInRange(validation.qualityScore, 0, 100, "qualityScore");

  for (const field of [
    "totalRows",
    "validRows",
    "invalidRows",
    "errorCount",
    "warningCount",
    "quarantinedRows",
  ]) {
    requireNonNegativeInteger(validation[field], `validation.${field}`);
  }

  if (validation.validRows + validation.invalidRows !== validation.totalRows) {
    throw new Error("validRows + invalidRows must equal totalRows");
  }

  requireNonEmptyString(patient.sourcePatientId, "patient.sourcePatientId");
  requireNonEmptyString(patient.fhirPatientId, "patient.fhirPatientId");

  if (artifact.artifactType !== "FHIR_R4_BUNDLE") {
    throw new Error("Unsupported artifactType");
  }

  requireNonEmptyString(artifact.bundleId, "artifact.bundleId");
  requireNonNegativeInteger(artifact.resourceCount, "artifact.resourceCount");

  if (artifact.resourceCount < 1) {
    throw new Error("resourceCount must be at least 1");
  }

  if (
    typeof artifact.sha256 !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(artifact.sha256)
  ) {
    throw new Error("artifact.sha256 must be a 64-character hexadecimal hash");
  }

  if (
    !Array.isArray(artifact.resourceTypes) ||
    artifact.resourceTypes.length === 0 ||
    !artifact.resourceTypes.every(
      (item: unknown) => typeof item === "string" && item.length > 0,
    )
  ) {
    throw new Error("artifact.resourceTypes must be a non-empty string array");
  }

  const bundle = requireRecord(artifact.bundle, "artifact.bundle");

  if (bundle.resourceType !== "Bundle") {
    throw new Error("artifact.bundle.resourceType must be Bundle");
  }

  if (bundle.id !== artifact.bundleId) {
    throw new Error("artifact.bundle.id must match artifact.bundleId");
  }

  if (!Array.isArray(bundle.entry) || bundle.entry.length !== artifact.resourceCount) {
    throw new Error("resourceCount must match artifact.bundle.entry length");
  }

  const entries = bundle.entry as unknown[];

  const resourceTypes = new Set<string>();
  let patientResourceCount = 0;
  const clinicalResourceTypes = new Set([
    "Observation",
    "Condition",
    "MedicationStatement",
    "Procedure",
    "Encounter",
    "DiagnosticReport",
    "AllergyIntolerance",
    "DocumentReference",
  ]);

  for (const [index, entryValue] of entries.entries()) {
    const entry = requireRecord(entryValue, `bundle.entry[${index}]`);
    const resource = requireRecord(entry.resource, `bundle.entry[${index}].resource`);

    requireNonEmptyString(
      resource.resourceType,
      `bundle.entry[${index}].resource.resourceType`,
    );

    resourceTypes.add(resource.resourceType);

    if (resource.resourceType === "Patient") {
      patientResourceCount += 1;
      if (resource.id !== patient.fhirPatientId) {
        throw new Error("Bundle contains a Patient for a different patient");
      }
    }

    if (clinicalResourceTypes.has(resource.resourceType)) {
      for (const subjectKey of ["subject", "patient"]) {
        const reference = resource[subjectKey];
        if (isRecord(reference) && typeof reference.reference === "string") {
          if (reference.reference !== `Patient/${patient.fhirPatientId}`) {
            throw new Error(
              "Clinical resources must reference the intended Patient",
            );
          }
        }
      }
    }
  }

  if (patientResourceCount !== 1) {
    throw new Error("Bundle must contain exactly one Patient resource");
  }

  if (
    new Set(artifact.resourceTypes).size !== artifact.resourceTypes.length ||
    resourceTypes.size !== artifact.resourceTypes.length ||
    artifact.resourceTypes.some((type: string) => !resourceTypes.has(type))
  ) {
    throw new Error("resourceTypes must match the Bundle resource types");
  }

  if (!["CSV", "XLSX", "XLS", "JSON"].includes(provenance.sourceFormat)) {
    throw new Error("Unsupported provenance.sourceFormat");
  }

  if (typeof provenance.mappingComplete !== "boolean") {
    throw new Error("provenance.mappingComplete must be a boolean");
  }

  return value as unknown as AnalyticsHandoffV1;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): Record<string, any> {
  if (!isRecord(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function requireIsoTimestamp(value: unknown, field: string): void {
  requireNonEmptyString(value, field);
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${field} must be a valid ISO 8601 timestamp`);
  }
}

function requireNonNegativeInteger(value: unknown, field: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
}

function requireNumberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  field: string,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}`);
  }
}
