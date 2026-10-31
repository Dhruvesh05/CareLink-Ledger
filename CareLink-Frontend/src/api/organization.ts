import { apiGet, apiPost, apiPatch } from "./client";
import { getToken } from "./auth";

export interface HospitalDepartment {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
}
export interface HospitalStats {
  associatedDoctors: number;
  activeDoctors: number;
  verifiedDoctors: number | null;
  associatedPatients: number;
  departments: number;
  appointments: number;
  pendingAssociations: number;
  invoices: Array<{ _id: string; count: number; amountMinor: number }>;
  appointmentStatus?: Array<{ status: string; count: number }>;
  monthlyAppointments?: Array<{ month: string; count: number }>;
  doctorsByDepartment?: Array<{ name: string; count: number }>;
  invoiceStatus?: Array<{ status: string; count: number; amountMinor: number }>;
  recentActivities: HospitalActivity[];
}
export interface HospitalActivity {
  _id: string;
  action: string;
  resource: string;
  actorRole: string;
  createdAt: string;
  actorUserId?: { walletAddress?: string; role?: string };
}
export interface HospitalPatient {
  patient: { _id: string; walletAddress: string; did?: string; active: boolean };
  appointments: number;
  lastAppointment?: string;
}
export interface HospitalDoctor {
  _id: string;
  walletAddress: string;
  did?: string;
  active: boolean;
  verificationStatus: string;
  association: HospitalAssociation | null;
}

export interface HospitalAssociation {
  _id: string;
  doctorUserId: { _id: string; walletAddress: string; active: boolean };
  departmentId?: { _id: string; name: string };
  status: "pending" | "active" | "revoked";
}

function token(): string {
  const value = getToken();
  if (!value) throw new Error("Your session has expired. Please sign in again.");
  return value;
}

export const getDepartments = () => apiGet<HospitalDepartment[]>("/organization/departments?active=all", token());
export const searchDepartments = (q: string) => apiGet<HospitalDepartment[]>(`/organization/departments?q=${encodeURIComponent(q)}`, token());
export const createDepartment = (name: string, description?: string) =>
  apiPost<HospitalDepartment>("/organization/departments", { name, description }, token());
export const updateDepartment = (id: string, data: { name?: string; description?: string; active?: boolean }) =>
  apiPatch<HospitalDepartment>(`/organization/departments/${id}`, data, token());
export const getHospitalAssociations = () =>
  apiGet<HospitalAssociation[]>("/organization/associations", token());
export const createHospitalAssociation = (doctorUserId: string, departmentId?: string) =>
  apiPost<HospitalAssociation>("/organization/associations", { doctorUserId, departmentId }, token());
export const getHospitalDoctors = (q?: string) =>
  apiGet<HospitalDoctor[]>(`/organization/doctors${q ? `?q=${encodeURIComponent(q)}` : ""}`, token());
export const updateHospitalAssociation = (id: string, status: HospitalAssociation["status"]) =>
  apiPatch<HospitalAssociation>(`/organization/associations/${id}`, { status }, token());
export const getHospitalPatients = () => apiGet<HospitalPatient[]>("/organization/patients", token());
export const getHospitalStats = () => apiGet<HospitalStats>("/organization/stats", token());
export const getHospitalActivities = () => apiGet<HospitalActivity[]>("/organization/activities", token());
