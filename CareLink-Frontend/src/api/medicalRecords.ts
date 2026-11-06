import { apiGet, apiGetBlob, apiPost } from "./client";
import {
  createOrLoadAuthenticatedDid,
  createSsiAuthorizationPresentation,
  requestSsiAuthorizationChallenge,
} from "./ssi";
import { getToken } from "./auth";

export interface PreparedMedicalRecordTransaction {
  preparationId: string;
  transaction: {
    to: string;
    data: string;
    chainId: number;
    value: string;
  };
  doctorWallet: string;
  hospitalWallet: string;
  patientWallet: string;
  cid: string;
  fileHash: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  emergency: boolean;
}

export interface ConfirmedMedicalRecord {
  preparationId: string;
  recordId: number;
  transactionHash: string;
  doctorWallet: string;
  hospitalWallet: string;
  patientWallet: string;
  cid: string;
  fileHash: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  emergency: boolean;
}

export interface MedicalRecordSummary {
  recordId?: number;
  id?: number;
  patient?: string;
  patientWallet?: string;
  doctor?: string;
  doctorWallet?: string;
  hospital?: string;
  hospitalWallet?: string;
  category?: string;
  fileName?: string;
  createdAt?: string;
  timestamp?: string;
  status?: string;
  transactionHash?: string;
  cid?: string;
  plaintextHash?: string;
  fileHash?: string;
  emergency?: boolean;
  blockchainStatus?: "anchored" | "not_anchored";
  fhirProcessingId?: string;
  fhirStatus?: "processing" | "completed" | "failed";
}

export interface PatientMedicalRecordUploadResult {
  record: MedicalRecordSummary & { recordId: number; cid: string };
  processingId: string;
  fhirStatus: "completed" | "failed";
  fhirError?: string;
}

export async function uploadPatientMedicalRecord(
  file: File,
  category: string,
  emergency: boolean,
  presentation: Record<string, unknown>,
  challengeId: string,
): Promise<PatientMedicalRecordUploadResult> {
  const token = getToken() ?? undefined;
  const payload = new FormData();
  payload.append("file", file);
  payload.append("category", category);
  payload.append("emergency", String(emergency));
  payload.append("presentation", JSON.stringify(presentation));
  payload.append("challengeId", challengeId);
  const response = await apiPost<{ data: PatientMedicalRecordUploadResult }>(
    "/medical-records/patient-upload",
    payload,
    token,
  );
  return response.data ?? response;
}

export interface FhirProcessingResult {
  processingId: string;
  recordId: number;
  patientUserId: string;
  originalCid: string;
  status: "processing" | "completed" | "failed";
  result?: Record<string, unknown>;
  errorMessage?: string;
}

export async function prepareMedicalRecord(payload: FormData): Promise<PreparedMedicalRecordTransaction> {
  const token = getToken() ?? undefined;
  const response = await apiPost<{ data: PreparedMedicalRecordTransaction }>("/medical-records/prepare", payload, token);
  return response.data ?? response;
}

export async function confirmMedicalRecord(
  preparationId: string,
  transactionHash: string,
  presentation: Record<string, unknown>,
  challengeId: string,
): Promise<ConfirmedMedicalRecord> {
  const token = getToken() ?? undefined;
  const response = await apiPost<{ data: ConfirmedMedicalRecord }>(
    "/medical-records/confirm",
    {
      preparationId,
      transactionHash,
      presentation,
      challengeId,
    },
    token,
  );
  return response.data ?? response;
}

export interface FabricMedicalRecordUploadResult {
  recordId: number;
  transactionId?: string;
  cid: string;
  fileHash: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  emergency: boolean;
}

export async function uploadFabricMedicalRecord(
  payload: FormData,
): Promise<FabricMedicalRecordUploadResult> {
  const token = getToken() ?? undefined;
  const response = await apiPost<{
    data: FabricMedicalRecordUploadResult;
  }>("/fabric/medical-records", payload, token);

  return response.data ?? response;
}

export async function getPatientRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication is required to retrieve patient records.");
  }

  // Generate a fresh, single-use SSI presentation for this protected GET.
  await createOrLoadAuthenticatedDid();
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);

  const response = await apiGet<{ records: MedicalRecordSummary[] }>(
    `/medical-records/patient/${encodeURIComponent(walletAddress)}`,
    token,
    {
      headers: {
        "X-CareLink-Presentation": JSON.stringify(presentation),
        "X-CareLink-Challenge-Id": challenge.challengeId,
      },
    },
  );

  return response.records ?? [];
}

export async function getDoctorRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken() ?? undefined;
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);
  const response = await apiGet<{ records: MedicalRecordSummary[] }>(
    `/medical-records/doctor/${encodeURIComponent(walletAddress)}`,
    token,
    {
      headers: {
        "X-CareLink-Presentation": JSON.stringify(presentation),
        "X-CareLink-Challenge-Id": challenge.challengeId,
      },
    },
  );
  return response.records ?? [];
}

export async function getHospitalRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken() ?? undefined;
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);
  const response = await apiGet<{ records: MedicalRecordSummary[] }>(
    `/medical-records/hospital/${encodeURIComponent(walletAddress)}`,
    token,
    {
      headers: {
        "X-CareLink-Presentation": JSON.stringify(presentation),
        "X-CareLink-Challenge-Id": challenge.challengeId,
      },
    },
  );
  return response.records ?? [];
}

export async function getPatientProfile(walletAddress: string): Promise<{ patient?: Record<string, unknown> } | null> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ patient: Record<string, unknown> }>(`/patients/${walletAddress}`, token);
  return response.patient ?? null;
}

export async function getTotalRecords(): Promise<number> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ total?: number; count?: number }>("/medical-records/stats/total", token);
  return response.total ?? response.count ?? 0;
}


export type MedicalRecordFileDisposition = "inline" | "attachment";

export interface MedicalRecordFile {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

function getFileNameFromDisposition(
  contentDisposition: string | null,
  fallbackFileName?: string,
): string {
  const header = contentDisposition ?? "";
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      // Fall through to the regular filename or the record's saved filename.
    }
  }

  const standardMatch = /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(header);
  const fromHeader = standardMatch?.[1] ?? standardMatch?.[2];

  return (fromHeader?.trim() || fallbackFileName?.trim() || "medical-record")
    .replace(/[\/\\\r\n]/g, "_");
}

export async function getMedicalRecordFile(
  recordId: number,
  disposition: MedicalRecordFileDisposition = "attachment",
  fallbackFileName?: string,
): Promise<MedicalRecordFile> {
  if (!Number.isSafeInteger(recordId) || recordId <= 0) {
    throw new Error("Invalid medical record ID.");
  }

  const token = getToken() ?? undefined;
  if (!token) {
    throw new Error("Authentication is required to access this medical record.");
  }

  // Persist/load the authenticated user's DID, obtain a fresh one-time
  // challenge, then create the presentation required by CareLink middleware.
  await createOrLoadAuthenticatedDid();
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);

  // POST is required because requireCareLinkRole reads the presentation
  // from req.body before the controller can retrieve and decrypt the file.
  const response = await apiGetBlob(
    `/medical-records/${encodeURIComponent(String(recordId))}/content?disposition=${disposition}`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ presentation, challengeId: challenge.challengeId }),
    },
  );

  return {
    blob: response.blob,
    fileName: getFileNameFromDisposition(
      response.contentDisposition,
      fallbackFileName,
    ),
    mimeType: response.contentType || "application/octet-stream",
  };
}

export async function analyzeMedicalRecord(
  recordId: number,
  fileName?: string,
): Promise<{ processingId: string; recordId: number; result: Record<string, unknown> }> {
  const file = await getMedicalRecordFile(recordId, "attachment", fileName);
  const token = getToken() ?? undefined;
  if (!token) {
    throw new Error("Authentication is required to analyze this medical record.");
  }

  await createOrLoadAuthenticatedDid();
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);
  const payload = new FormData();
  payload.append(
    "file",
    new File([file.blob], file.fileName, { type: file.mimeType }),
  );
  payload.append("presentation", JSON.stringify(presentation));
  payload.append("challengeId", challenge.challengeId);

  return apiPost<{
    processingId: string;
    recordId: number;
    result: Record<string, unknown>;
  }>(
    `/analytics/medical-record/${encodeURIComponent(String(recordId))}`,
    payload,
    token,
  );
}

export async function getFhirProcessingResult(
  recordId: number,
  processingId: string,
): Promise<FhirProcessingResult> {
  const token = getToken() ?? undefined;
  if (!token) {
    throw new Error("Authentication is required to retrieve FHIR results.");
  }

  await createOrLoadAuthenticatedDid();
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);
  const response = await apiGet<{
    data: FhirProcessingResult;
  }>(
    `/analytics/medical-record/${encodeURIComponent(String(recordId))}/results/${encodeURIComponent(processingId)}`,
    token,
    {
      headers: {
        "X-CareLink-Presentation": JSON.stringify(presentation),
        "X-CareLink-Challenge-Id": challenge.challengeId,
      },
    },
  );
  return response.data ?? response;
}
