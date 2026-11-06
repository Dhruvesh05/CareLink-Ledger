import { apiGet, apiPatch, apiPost } from "./client";
import { getToken } from "./auth";
import { ensureWalletNetwork, getEthereumProvider, sendMetaMaskTransaction, signMessage } from "./wallet";
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
  permissionType: "READ_ONLY" | "COMMENT_ONLY";
  recordIds: number[];
  expiresAt?: string;
  status: string;
  transactionHashes: string[];
  createdAt: string;
}
type UnsignedAccessTransaction = { recordId: number; to: string; data: string; chainId: number };
type PreparedConsent = { requestId?: string; mode?: "signature"; message?: string; transactions?: UnsignedAccessTransaction[]; status?: string };

export const getDoctorPatients = () => apiGet<ClinicalPatient[]>("/clinical/patients", token());
export const getTreatmentNotes = () => apiGet<TreatmentNote[]>("/clinical/notes", token());
export const createTreatmentNote = (data: { patientUserId: string; appointmentId?: string; note: string }) =>
  apiPost<TreatmentNote>("/clinical/notes", data, token());
export const getNotifications = () => apiGet<Notification[]>("/clinical/notifications", token());
export const markNotificationRead = (id: string) => apiPatch<Notification>(`/clinical/notifications/${id}/read`, {}, token());
export const searchEligiblePatients = (query: string) => apiGet<Array<{ _id: string; walletAddress: string; did?: string }>>(`/clinical/access-requests/patients?q=${encodeURIComponent(query)}`, token());
export const getAccessRequests = () => apiGet<AccessRequest[]>("/clinical/access-requests", token());
export const createAccessRequest = (data: { patientUserId: string; reason: string; scope: "medical_records"; permissionType: "READ_ONLY" | "COMMENT_ONLY"; recordIds: number[]; expiresAt?: string }) =>
  apiPost<AccessRequest>("/clinical/access-requests", data, token());

async function submitPatientTransactions(path: string, confirmPath: string): Promise<AccessRequest> {
  const prepared = await apiPost<PreparedConsent>(path, {}, token());
  if (prepared.status) return prepared as unknown as AccessRequest;
  if (prepared.mode === "signature") {
    if (!prepared.requestId || !prepared.message) throw new Error("The backend returned an incomplete consent challenge.");
    const provider = getEthereumProvider();
    if (!provider) throw new Error("MetaMask is required for patient authorization.");
    const accounts = await provider.request({ method: "eth_accounts" }) as string[];
    if (!accounts?.[0]) throw new Error("Connect the patient wallet before authorizing access.");
    const signature = await signMessage(prepared.message, accounts[0]);
    return apiPost<AccessRequest>(confirmPath.replace(":requestId", prepared.requestId), { signature }, token());
  }
  if (!prepared.requestId || !prepared.transactions?.length) throw new Error("The backend returned no authorization transactions.");
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
export interface RecordComment {
  _id: string;
  patientUserId: { walletAddress: string; did?: string } | string;
  doctorUserId: { walletAddress: string; did?: string } | string;
  accessRequestId: string;
  recordRef: { chainId: number; contractAddress: string; recordId: number };
  content: string;
  createdAt: string;
}
export const getRecordComments = () => apiGet<RecordComment[]>("/clinical/comments", token());
export const createRecordComment = (data: { patientUserId: string; recordId: number; content: string }) =>
  apiPost<RecordComment>("/clinical/comments", data, token());
