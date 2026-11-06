import { apiGet, apiGetBlob } from "./client";
import { getToken } from "./auth";
import {
  createOrLoadAuthenticatedDid,
  createSsiAuthorizationPresentation,
  requestSsiAuthorizationChallenge,
} from "./ssi";

export interface FabricMedicalRecord {
  id: string;
  recordId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  cid: string;
  fileHash: string;
  category: string;
  emergency: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  ledger: string;
}

interface FabricMedicalRecordResponse {
  success: boolean;
  network: string;
  channel: string;
  records: FabricMedicalRecord[];
}


export type FabricMedicalRecordFileDisposition = "inline" | "attachment";

export interface FabricMedicalRecordFile {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

function getFabricFileName(
  contentDisposition: string | null,
  fallbackFileName?: string,
): string {
  const header = contentDisposition ?? "";
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);

  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ""));
    } catch {
      // Try the standard filename header below.
    }
  }

  const standard = /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(header);
  return (standard?.[1] ?? standard?.[2] ?? fallbackFileName ?? "medical-record")
    .trim()
    .replace(/[\/\\\r\n]/g, "_");
}

export async function getFabricMedicalRecordFile(
  recordId: string,
  disposition: FabricMedicalRecordFileDisposition = "attachment",
  fallbackFileName?: string,
): Promise<FabricMedicalRecordFile> {
  const id = recordId.trim();

  if (!id || id.length > 256 || /[\/\\\u0000-\u001f\u007f]/.test(id)) {
    throw new Error("Invalid Fabric medical record ID.");
  }

  const token = getToken() ?? undefined;
  if (!token) {
    throw new Error("Authentication is required to access this medical record.");
  }

  await createOrLoadAuthenticatedDid();
  const challenge = await requestSsiAuthorizationChallenge();
  const presentation = await createSsiAuthorizationPresentation(challenge.challengeId);

  const response = await apiGetBlob(
    `/fabric/medical-records/${encodeURIComponent(id)}/content?disposition=${disposition}`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ presentation, challengeId: challenge.challengeId }),
    },
  );

  return {
    blob: response.blob,
    fileName: getFabricFileName(response.contentDisposition, fallbackFileName),
    mimeType: response.contentType || "application/octet-stream",
  };
}

export async function getMyFabricRecords(): Promise<FabricMedicalRecordResponse> {
  return apiGet<FabricMedicalRecordResponse>(
    "/fabric/medical-records/mine",
    getToken() ?? undefined,
  );
}
