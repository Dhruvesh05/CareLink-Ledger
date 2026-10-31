import { apiGet, apiPost } from "./client";
import { getToken } from "./auth";

export interface AdminStats {
  users: number;
  patients: number;
  doctors: number;
  hospitals: number;
  activeUsers: number;
  medicalRecords: number;
  crossChain: number;
  failedOperations: number;
  auditEvents: number;
  verifiedDoctors: number | null;
  verifiedHospitals: number | null;
  pendingDoctors: number | null;
  pendingHospitals: number | null;
  roleDistribution?: Array<{ _id: string; count: number }>;
  registrationTrend?: Array<{ _id: string; count: number }>;
  transactionStatus?: Array<{ _id: string; count: number }>;
  auditCategory?: Array<{ _id: string; count: number }>;
}

export interface AdminUser {
  _id: string;
  walletAddress: string;
  role: "Admin" | "Patient" | "Doctor" | "Hospital";
  active: boolean;
  displayName: string;
  createdAt: string;
}

async function getCount(path: string): Promise<number> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ total?: number; count?: number }>(path, token);
  return response.total ?? response.count ?? 0;
}

export const getDoctorCount = () => getCount("/doctors/total");
export const getHospitalCount = () => getCount("/hospitals/count");
export const getAuditLogCount = () => getCount("/audit/stats/total");
export const getAdminStats = () => apiGet<AdminStats>("/admin/stats", getToken() ?? undefined);
export const getAdminUsers = () => apiGet<AdminUser[]>("/admin/users", getToken() ?? undefined);
export const searchAdminUsers = (params: { q?: string; role?: string; active?: string }) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value) as Array<[string, string]>).toString();
  return apiGet<AdminUser[]>(`/admin/users${query ? `?${query}` : ""}`, getToken() ?? undefined);
};
export interface AdminAuditEvent {
  _id: string;
  category: string;
  actorRole?: string;
  event: string;
  resource: string;
  transactionReference?: string;
  result: string;
  createdAt: string;
  actorUserId?: { walletAddress?: string; role?: string };
}
export const getAdminAudit = (params?: { category?: string; result?: string; page?: number; q?: string; from?: string; to?: string }) => {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.result) query.set("result", params.result);
  if (params?.page) query.set("page", String(params.page));
  if (params?.q) query.set("q", params.q);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  return apiGet<{ events: AdminAuditEvent[]; total: number; page: number; pages: number }>(`/admin/audit${query.size ? `?${query}` : ""}`, getToken() ?? undefined);
};
export const getAdminAuditStats = () => apiGet<{ total: number; failures: number; access: number; consent: number }>("/admin/audit/stats", getToken() ?? undefined);
export interface AdminNetworkMonitoring {
  database?: { status?: string };
  networks: {
    ethereum: { name: string; chainId: number; status: string; rpcReady: boolean; blockHeight: number | null; checkedAt: string; latencyMs?: number; error?: string };
    polygon: { name: string; chainId: number; status: string; rpcReady: boolean; blockHeight: number | null; checkedAt: string; latencyMs?: number; error?: string };
    fabric: { status: string; configured: boolean; message: string };
  };
  ipfs: { provider: string; api: { status: string; endpoint: string }; gateway: { status: string; endpoint: string }; checkedAt: string };
  crossChain: Array<{ _id: string; count: number }>;
}
export const getCrossChainAudits = (params?: { source?: string; destination?: string; status?: string; q?: string; wallet?: string; page?: number }) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined && value !== "") query.set(key, String(value));
  return apiGet<{ items: Array<Record<string, unknown>>; total: number; page: number; pages: number; grouped: Array<{ _id: string; count: number }> }>(`/admin/cross-chain${query.size ? `?${query}` : ""}`, getToken() ?? undefined);
};
export const getAdminMonitoring = () => apiGet<AdminNetworkMonitoring>("/admin/monitoring", getToken() ?? undefined);
export const getAdminIpfsCid = (cid: string) => apiGet<{ cid: string; pinned: boolean; retrievable: boolean; gateway: string; checkedAt: string }>(`/admin/ipfs/${encodeURIComponent(cid)}`, getToken() ?? undefined);
export const getAdminReport = (type: string) => apiGet<string>(`/admin/reports?type=${encodeURIComponent(type)}`, getToken() ?? undefined, { headers: { Accept: "text/csv" } });

export async function getVerificationStatus(role: "Doctor" | "Hospital", wallet: string): Promise<boolean> {
  const path = role === "Doctor" ? "/doctors/verified" : "/hospitals/verified";
  const response = await apiGet<{ verified?: boolean; isVerified?: boolean }>(
    `${path}/${encodeURIComponent(wallet)}`,
    getToken() ?? undefined,
  );
  return response.verified ?? response.isVerified ?? false;
}

export function verifyUser(role: "Doctor" | "Hospital", wallet: string) {
  return apiPost(
    role === "Doctor" ? "/doctors/verify" : "/hospitals/verify",
    { wallet },
    getToken() ?? undefined,
  );
}

export function revokeVerification(role: "Doctor" | "Hospital", wallet: string) {
  return apiPost(
    role === "Doctor" ? "/doctors/revoke-verification" : "/hospitals/revoke",
    { wallet },
    getToken() ?? undefined,
  );
}