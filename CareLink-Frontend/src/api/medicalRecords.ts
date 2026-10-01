import { apiGet, apiPost } from "./client";
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
  emergency?: boolean;
}

export async function prepareMedicalRecord(payload: FormData): Promise<PreparedMedicalRecordTransaction> {
  const token = getToken() ?? undefined;
  const response = await apiPost<{ data: PreparedMedicalRecordTransaction }>("/medical-records/prepare", payload, token);
  return response.data ?? response;
}

export async function confirmMedicalRecord(preparationId: string, transactionHash: string): Promise<ConfirmedMedicalRecord> {
  const token = getToken() ?? undefined;
  const response = await apiPost<{ data: ConfirmedMedicalRecord }>("/medical-records/confirm", {
    preparationId,
    transactionHash,
  }, token);
  return response.data ?? response;
}

export async function getPatientRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ records: MedicalRecordSummary[] }>(`/medical-records/patient/${walletAddress}`, token);
  return response.records ?? [];
}

export async function getDoctorRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ records: MedicalRecordSummary[] }>(`/medical-records/doctor/${walletAddress}`, token);
  return response.records ?? [];
}

export async function getHospitalRecords(walletAddress: string): Promise<MedicalRecordSummary[]> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ records: MedicalRecordSummary[] }>(`/medical-records/hospital/${walletAddress}`, token);
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
