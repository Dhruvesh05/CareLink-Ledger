import { apiGet, apiPost, apiPatch } from "./client";
import { getToken } from "./auth";

export type AppointmentStatus = "requested" | "confirmed" | "cancelled" | "completed";
export type InvoiceStatus = "issued" | "paid" | "void";

export interface Appointment {
  _id: string;
  patientUserId: { _id: string; walletAddress: string };
  doctorUserId: { _id: string; walletAddress: string };
  hospitalUserId?: { _id: string; walletAddress: string };
  scheduledAt: string;
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  statusHistory?: Array<{ status: AppointmentStatus; changedBy: string; changedAt: string }>;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  issueDate: string;
  patientUserId: string;
  hospitalUserId: string;
  description: string;
  lineItems: Array<{ description: string; quantity: number; unitAmountMinor: number; totalAmountMinor: number }>;
  amountMinor: number;
  currency: string;
  status: InvoiceStatus;
  dueAt?: string;
  paidAt?: string;
  statusHistory?: Array<{ status: InvoiceStatus; changedBy: string; changedAt: string }>;
}

function token() {
  const value = getToken();
  if (!value) throw new Error("Your session has expired. Please sign in again.");
  return value;
}

export const getAppointments = () => apiGet<Appointment[]>("/operations/appointments", token());
export const createAppointment = (data: {
  doctorUserId?: string;
  patientUserId?: string;
  hospitalUserId?: string;
  scheduledAt: string;
  durationMinutes?: number;
  reason: string;
}) => apiPost<Appointment>("/operations/appointments", data, token());
export const updateAppointment = (id: string, data: { status?: AppointmentStatus; scheduledAt?: string; durationMinutes?: number }) =>
  apiPatch<Appointment>(`/operations/appointments/${id}`, data, token());
export const getInvoices = (params?: { q?: string; status?: InvoiceStatus }) => {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  return apiGet<Invoice[]>(`/operations/invoices${query.size ? `?${query}` : ""}`, token());
};
export const getInvoice = (id: string) => apiGet<Invoice>(`/operations/invoices/${id}`, token());
export const createInvoice = (data: {
  patientUserId: string;
  description: string;
  amountMinor: number;
  currency?: string;
  dueAt?: string;
  appointmentId?: string;
  issueDate?: string;
}) => apiPost<Invoice>("/operations/invoices", data, token());
export const updateInvoice = (id: string, status: InvoiceStatus) =>
  apiPatch<Invoice>(`/operations/invoices/${id}`, { status }, token());
