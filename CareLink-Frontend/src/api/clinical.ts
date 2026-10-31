import { apiGet, apiPatch, apiPost } from "./client";
import { getToken } from "./auth";
import { ensureWalletNetwork, getEthereumProvider, sendMetaMaskTransaction } from "./wallet";
import { getSelectedChainId } from "./network";

function token() {
  const value = getToken();
  if (!value) throw new Error("Your session has expired. Please sign in again.");
  return value;
}

export interface ClinicalPatient {
  patient: { _id: string; walletAddress: string; did?: string; active: boolean };
  appointments: number;
  lastAppointment: string;
}
export interface TreatmentNote {
  _id: string;
  patientUserId: { _id: string; walletAddress: string };
  doctorUserId: { _id: string; walletAddress: string };
  note: string;
  createdAt: string;
}
export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
}
export interface AccessRequest {
  _id: string;
  doctorUserId: { _id: string; walletAddress: string; did?: string } | string;
  patientUserId: { _id: string; walletAddress: string; did?: string } | string;
  reason: string;
  scope: "medical_records";
  expiresAt?: string;
  status: string;
  transactionHashes: string[];
  createdAt: string;
}
type UnsignedAccessTransaction = { recordId: number; to: string; data: string; chainId: number };

export const getDoctorPatients = () => apiGet<ClinicalPatient[]>("/clinical/patients", token());
export const getTreatmentNotes = () => apiGet<TreatmentNote[]>("/clinical/notes", token());
export const createTreatmentNote = (data: { patientUserId: string; appointmentId?: string; note: string }) =>
  apiPost<TreatmentNote>("/clinical/notes", data, token());
export const getNotifications = () => apiGet<Notification[]>("/clinical/notifications", token());
export const markNotificationRead = (id: string) => apiPatch<Notification>(`/clinical/notifications/${id}/read`, {}, token());
export const searchEligiblePatients = (query: string) => apiGet<Array<{ _id: string; walletAddress: string; did?: string }>>(`/clinical/access-requests/patients?q=${encodeURIComponent(query)}`, token());
export const getAccessRequests = () => apiGet<AccessRequest[]>("/clinical/access-requests", token());
export const createAccessRequest = (data: { patientUserId: string; reason: string; scope: "medical_records"; expiresAt?: string }) =>
  apiPost<AccessRequest>("/clinical/access-requests", data, token());

async function submitPatientTransactions(path: string, confirmPath: string): Promise<AccessRequest> {
  const prepared = await apiPost<{ requestId: string; transactions: UnsignedAccessTransaction[] }>(path, {}, token());
  const chainId = prepared.transactions[0]?.chainId ?? getSelectedChainId();
  await ensureWalletNetwork(chainId);
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is required for patient authorization.");
  const accounts = await provider.request({ method: "eth_accounts" }) as string[];
  if (!accounts?.[0]) throw new Error("Connect the patient wallet before authorizing access.");
  const transactionHashes: string[] = [];
  for (const transaction of prepared.transactions) {
    transactionHashes.push(await sendMetaMaskTransaction({ from: accounts[0], to: transaction.to, data: transaction.data, chainId: transaction.chainId }));
  }
  return apiPost<AccessRequest>(confirmPath.replace(":requestId", prepared.requestId), { transactionHashes }, token());
}

export const approveAccessRequest = (requestId: string) =>
  submitPatientTransactions(`/clinical/access-requests/${requestId}/approve/prepare`, `/clinical/access-requests/:requestId/approve/confirm`);
export const revokeAccessRequest = (requestId: string) =>
  submitPatientTransactions(`/clinical/access-requests/${requestId}/revoke/prepare`, `/clinical/access-requests/:requestId/revoke/confirm`);
export const rejectAccessRequest = (requestId: string) =>
  apiPost<AccessRequest>(`/clinical/access-requests/${requestId}/reject`, {}, token());
