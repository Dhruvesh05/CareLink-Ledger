import type { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../models/User";
import AppointmentModel, { AppointmentStatus } from "../models/Appointment";
import HospitalDoctorAssociationModel from "../models/HospitalDoctorAssociation";
import InvoiceModel, { InvoiceStatus, IInvoiceLineItem } from "../models/Invoice";
import HospitalActivityLogModel from "../models/HospitalActivityLog";

const appointmentStatuses: AppointmentStatus[] = ["requested", "confirmed", "cancelled", "completed"];
const invoiceStatuses: InvoiceStatus[] = ["issued", "paid", "void"];
const activeAppointmentStatuses: AppointmentStatus[] = ["requested", "confirmed"];

export function parseFutureDate(value: unknown, now = Date.now()): Date | undefined {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getTime() <= now ? undefined : date;
}

export function parseDuration(value: unknown): number | undefined {
  const duration = typeof value === "number" ? value : Number(value);
  return Number.isInteger(duration) && duration >= 15 && duration <= 240 ? duration : undefined;
}

export function validAppointmentStatus(value: unknown): value is AppointmentStatus {
  return appointmentStatuses.includes(value as AppointmentStatus);
}

export function validInvoiceStatus(value: unknown): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus);
}

export function canCreateAppointment(role: string | undefined) {
  return role === "Patient" || role === "Doctor";
}

export function appointmentFilterForActor(role: string | undefined, id: Types.ObjectId) {
  if (role === "Patient") return { patientUserId: id };
  if (role === "Doctor") return { doctorUserId: id };
  if (role === "Hospital") return { hospitalUserId: id };
  return { _id: new Types.ObjectId("000000000000000000000000") };
}

export function invoiceFilterForActor(role: string | undefined, id: Types.ObjectId) {
  if (role === "Patient") return { patientUserId: id };
  if (role === "Hospital") return { hospitalUserId: id };
  return { _id: new Types.ObjectId("000000000000000000000000") };
}

export function normaliseInvoiceLineItems(body: Record<string, unknown>) {
  return normaliseLineItems(body);
}

function actorId(req: Request): Types.ObjectId {
  if (!req.auth?.userId || !Types.ObjectId.isValid(req.auth.userId)) {
    throw Object.assign(new Error("Authenticated user not found"), { status: 401 });
  }
  return new Types.ObjectId(req.auth.userId);
}

function fail(res: Response, error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status) || 500
    : 500;
  return res.status(status).json({ success: false, message: error instanceof Error ? error.message : "Operations request failed" });
}

async function logHospitalActivity(req: Request, hospitalUserId: Types.ObjectId | undefined, action: string, resource: string, resourceId: Types.ObjectId) {
  if (!hospitalUserId || !req.auth?.userId || !Types.ObjectId.isValid(req.auth.userId)) return;
  await HospitalActivityLogModel.create({
    hospitalUserId,
    actorUserId: new Types.ObjectId(req.auth.userId),
    actorRole: req.auth.role ?? "Unknown",
    action,
    resource,
    resourceId,
  });
}

function overlaps(start: Date, durationMinutes: number, otherStart: Date, otherDurationMinutes: number) {
  const end = start.getTime() + durationMinutes * 60_000;
  const otherEnd = otherStart.getTime() + otherDurationMinutes * 60_000;
  return start.getTime() < otherEnd && otherStart.getTime() < end;
}

function transitionAllowed(current: AppointmentStatus, next: AppointmentStatus) {
  return current !== next && (
    (current === "requested" && ["confirmed", "cancelled"].includes(next)) ||
    (current === "confirmed" && ["completed", "cancelled"].includes(next))
  );
}

export function canTransitionAppointment(role: string | undefined, current: AppointmentStatus, next: AppointmentStatus) {
  if (!transitionAllowed(current, next)) return false;
  if (next === "confirmed" || next === "completed") return role === "Doctor" || role === "Hospital";
  return role === "Patient" || role === "Doctor" || role === "Hospital";
}

function invoiceTransitionAllowed(current: InvoiceStatus, next: InvoiceStatus) {
  return current === "issued" && ["paid", "void"].includes(next);
}

export function canTransitionInvoice(role: string | undefined, current: InvoiceStatus, next: InvoiceStatus) {
  return role === "Hospital" && invoiceTransitionAllowed(current, next);
}

function normaliseLineItems(body: Record<string, unknown>): { items: IInvoiceLineItem[]; total: number } | undefined {
  const raw = body.lineItems;
  if (!Array.isArray(raw) || raw.length === 0) {
    if (typeof body.description !== "string" || !body.description.trim() || typeof body.amountMinor !== "number" ||
      !Number.isInteger(body.amountMinor) || body.amountMinor < 1) return undefined;
    return {
      items: [{ description: body.description.trim(), quantity: 1, unitAmountMinor: body.amountMinor, totalAmountMinor: body.amountMinor }],
      total: body.amountMinor,
    };
  }
  const items: IInvoiceLineItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return undefined;
    const value = item as Record<string, unknown>;
    const description = typeof value.description === "string" ? value.description.trim() : "";
    const quantity = Number(value.quantity);
    const unitAmountMinor = Number(value.unitAmountMinor);
    if (!description || !Number.isInteger(quantity) || quantity < 1 || quantity > 10_000 ||
      !Number.isInteger(unitAmountMinor) || unitAmountMinor < 0) return undefined;
    items.push({ description, quantity, unitAmountMinor, totalAmountMinor: quantity * unitAmountMinor });
  }
  return { items, total: items.reduce((sum, item) => sum + item.totalAmountMinor, 0) };
}

export class OperationsController {
  async listAppointments(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const filter = appointmentFilterForActor(req.auth?.role, id);
      const appointments = await AppointmentModel.find(filter)
        .populate("patientUserId", "walletAddress")
        .populate("doctorUserId", "walletAddress")
        .populate("hospitalUserId", "walletAddress")
        .sort({ scheduledAt: 1 })
        .lean();
      return res.json({ success: true, data: appointments });
    } catch (error) {
      return fail(res, error);
    }
  }

  async createAppointment(req: Request, res: Response) {
    try {
      const id = actorId(req);
      if (!canCreateAppointment(req.auth?.role)) {
        return res.status(403).json({ success: false, message: "Only patients and doctors can create appointments" });
      }
      const body = (req.body ?? {}) as Record<string, unknown>;
      const patient = req.auth.role === "Patient" ? id : body.patientUserId;
      const doctor = req.auth.role === "Doctor" ? id : body.doctorUserId;
      if (!Types.ObjectId.isValid(String(patient)) || !Types.ObjectId.isValid(String(doctor))) {
        return res.status(400).json({ success: false, message: "Patient and doctor are required" });
      }
      const scheduledAt = parseFutureDate(body.scheduledAt);
      const durationMinutes = parseDuration(body.durationMinutes ?? 30);
      if (!scheduledAt || !durationMinutes) {
        return res.status(400).json({ success: false, message: "A future date and duration between 15 and 240 minutes are required" });
      }
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (!reason) return res.status(400).json({ success: false, message: "Appointment reason is required" });
      const users = await UserModel.find({ _id: { $in: [patient, doctor] }, active: true }).select("_id role");
      if (users.length !== 2 || !users.some((user) => user.role === "Patient") || !users.some((user) => user.role === "Doctor")) {
        return res.status(404).json({ success: false, message: "Active patient and doctor are required" });
      }
      const hospitalValue = body.hospitalUserId;
      let hospital: Types.ObjectId | undefined;
      if (hospitalValue !== undefined) {
        if (!Types.ObjectId.isValid(String(hospitalValue))) {
          return res.status(400).json({ success: false, message: "A valid hospital is required" });
        }
        const hospitalUser = await UserModel.findOne({ _id: hospitalValue, role: "Hospital", active: true }).select("_id");
        if (!hospitalUser) return res.status(404).json({ success: false, message: "Active hospital not found" });
        const association = await HospitalDoctorAssociationModel.exists({
          hospitalUserId: hospitalUser._id,
          doctorUserId: doctor,
          status: "active",
        });
        if (!association) return res.status(403).json({ success: false, message: "Doctor is not associated with this hospital" });
        hospital = hospitalUser._id;
      }
      const participantIds: unknown[] = hospital ? [patient, doctor, hospital] : [patient, doctor];
      const participantFilters: Array<Record<string, unknown>> = [
        ...participantIds.map((participantId) => ({ patientUserId: participantId })),
        ...participantIds.map((participantId) => ({ doctorUserId: participantId })),
      ];
      const existing = await AppointmentModel.find({
        $or: participantFilters,
        status: { $in: activeAppointmentStatuses },
      }).select("patientUserId doctorUserId scheduledAt durationMinutes").lean();
      if (existing.some((item) => overlaps(scheduledAt, durationMinutes, item.scheduledAt, item.durationMinutes))) {
        return res.status(409).json({ success: false, message: "An overlapping appointment already exists" });
      }
      const appointment = await AppointmentModel.create({
        patientUserId: patient,
        doctorUserId: doctor,
        hospitalUserId: hospital,
        scheduledAt,
        durationMinutes,
        reason,
        status: "requested",
        statusHistory: [{ status: "requested", changedBy: id, changedAt: new Date() }],
      });
      await logHospitalActivity(req, hospital, "appointment.created", "appointment", appointment._id);
      return res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      return fail(res, error);
    }
  }

  async updateAppointment(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const appointment = await AppointmentModel.findOne({
        _id: req.params.appointmentId,
        $or: [{ patientUserId: id }, { doctorUserId: id }, { hospitalUserId: id }],
      });
      if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
      const body = (req.body ?? {}) as Record<string, unknown>;
      const nextStatus = body.status;
      if (nextStatus !== undefined && !validAppointmentStatus(nextStatus)) {
        return res.status(400).json({ success: false, message: "Invalid appointment status" });
      }
      const nextDate = body.scheduledAt === undefined ? appointment.scheduledAt : parseFutureDate(body.scheduledAt);
      const nextDuration = body.durationMinutes === undefined ? appointment.durationMinutes : parseDuration(body.durationMinutes);
      if (!nextDate || !nextDuration) return res.status(400).json({ success: false, message: "A future date and valid duration are required" });
      const isReschedule = nextDate.getTime() !== appointment.scheduledAt.getTime() || nextDuration !== appointment.durationMinutes;
      if (isReschedule && ["cancelled", "completed"].includes(appointment.status)) {
        return res.status(409).json({ success: false, message: "This appointment can no longer be rescheduled" });
      }
      if (nextStatus !== undefined && nextStatus !== appointment.status) {
        if (!transitionAllowed(appointment.status, nextStatus)) return res.status(409).json({ success: false, message: "Invalid appointment status transition" });
        if (!canTransitionAppointment(req.auth?.role, appointment.status, nextStatus)) {
          return res.status(403).json({ success: false, message: "You are not allowed to perform this appointment transition" });
        }
        appointment.status = nextStatus;
        appointment.statusHistory.push({ status: nextStatus, changedBy: id, changedAt: new Date() });
      }
      if (isReschedule) {
        const participantFilter = appointment.hospitalUserId
          ? { $or: [{ patientUserId: appointment.patientUserId }, { doctorUserId: appointment.doctorUserId }, { hospitalUserId: appointment.hospitalUserId }] }
          : { $or: [{ patientUserId: appointment.patientUserId }, { doctorUserId: appointment.doctorUserId }] };
        const existing = await AppointmentModel.find({
          ...participantFilter,
          _id: { $ne: appointment._id },
          status: { $in: activeAppointmentStatuses },
        }).select("scheduledAt durationMinutes").lean();
        if (existing.some((item) => overlaps(nextDate, nextDuration, item.scheduledAt, item.durationMinutes))) {
          return res.status(409).json({ success: false, message: "An overlapping appointment already exists" });
        }
        appointment.scheduledAt = nextDate;
        appointment.durationMinutes = nextDuration;
      }
      await appointment.save();
      await logHospitalActivity(req, appointment.hospitalUserId, isReschedule ? "appointment.rescheduled" : "appointment.updated", "appointment", appointment._id);
      return res.json({ success: true, data: appointment });
    } catch (error) {
      return fail(res, error);
    }
  }

  async listInvoices(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const filter: Record<string, unknown> = invoiceFilterForActor(req.auth?.role, id);
      if (typeof req.query.status === "string" && validInvoiceStatus(req.query.status)) filter.status = req.query.status;
      if (typeof req.query.q === "string" && req.query.q.trim()) filter.$or = [
        { invoiceNumber: { $regex: req.query.q.trim(), $options: "i" } },
        { description: { $regex: req.query.q.trim(), $options: "i" } },
      ];
      const invoices = await InvoiceModel.find(filter).sort({ issueDate: -1 }).lean();
      return res.json({ success: true, data: invoices });
    } catch (error) {
      return fail(res, error);
    }
  }

  async getInvoice(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const ownership = invoiceFilterForActor(req.auth?.role, id);
      const invoice = await InvoiceModel.findOne({ _id: req.params.invoiceId, ...ownership }).lean();
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      return res.json({ success: true, data: invoice });
    } catch (error) {
      return fail(res, error);
    }
  }

  async createInvoice(req: Request, res: Response) {
    try {
      const id = actorId(req);
      if (req.auth?.role !== "Hospital") return res.status(403).json({ success: false, message: "Only hospitals can issue invoices" });
      const body = (req.body ?? {}) as Record<string, unknown>;
      if (!Types.ObjectId.isValid(String(body.patientUserId))) return res.status(400).json({ success: false, message: "A valid patient is required" });
      const lineItems = normaliseLineItems(body);
      if (!lineItems || lineItems.total < 1) return res.status(400).json({ success: false, message: "Valid invoice line items are required" });
      const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "INR";
      if (!/^[A-Z]{3}$/.test(currency)) return res.status(400).json({ success: false, message: "Currency must be a three-letter code" });
      const issueDate = body.issueDate === undefined ? new Date() : new Date(String(body.issueDate));
      const dueAt = body.dueAt === undefined ? undefined : new Date(String(body.dueAt));
      if (Number.isNaN(issueDate.getTime()) || (dueAt && Number.isNaN(dueAt.getTime())) || (dueAt && dueAt < issueDate)) {
        return res.status(400).json({ success: false, message: "Invoice dates are invalid" });
      }
      const patient = await UserModel.findOne({ _id: body.patientUserId, role: "Patient", active: true }).select("_id");
      if (!patient) return res.status(404).json({ success: false, message: "Active patient not found" });
      const appointment = await AppointmentModel.findOne({
        _id: body.appointmentId,
        patientUserId: patient._id,
        hospitalUserId: id,
        status: { $ne: "cancelled" },
      }).select("_id");
      if (!appointment) return res.status(400).json({ success: false, message: "Invoice must reference an active hospital appointment" });
      const now = new Date();
      const invoice = await InvoiceModel.create({
        patientUserId: patient._id,
        hospitalUserId: id,
        appointmentId: appointment._id,
        invoiceNumber: `CL-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
        issueDate,
        description: lineItems.items.map((item) => item.description).join(", "),
        lineItems: lineItems.items,
        amountMinor: lineItems.total,
        currency,
        dueAt,
        status: "issued",
        statusHistory: [{ status: "issued", changedBy: id, changedAt: now }],
      });
      await logHospitalActivity(req, id, "invoice.created", "invoice", invoice._id);
      return res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      return fail(res, error);
    }
  }

  async updateInvoice(req: Request, res: Response) {
    try {
      const id = actorId(req);
      if (req.auth?.role !== "Hospital") return res.status(403).json({ success: false, message: "Only hospitals can update invoices" });
      const status = req.body?.status;
      if (!validInvoiceStatus(status)) return res.status(400).json({ success: false, message: "Invalid invoice status" });
      const invoice = await InvoiceModel.findOne({ _id: req.params.invoiceId, hospitalUserId: id });
      if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
      if (!canTransitionInvoice(req.auth?.role, invoice.status, status)) return res.status(409).json({ success: false, message: "Invalid invoice status transition" });
      invoice.status = status;
      invoice.paidAt = status === "paid" ? new Date() : undefined;
      invoice.statusHistory.push({ status, changedBy: id, changedAt: new Date() });
      await invoice.save();
      await logHospitalActivity(req, invoice.hospitalUserId, "invoice.updated", "invoice", invoice._id);
      return res.json({ success: true, data: invoice });
    } catch (error) {
      return fail(res, error);
    }
  }
}
