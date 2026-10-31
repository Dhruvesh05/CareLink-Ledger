import type { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../models/User";
import AppointmentModel from "../models/Appointment";
import TreatmentNoteModel from "../models/TreatmentNote";
import NotificationModel from "../models/Notification";
import AccessRequestModel, { type AccessRequestStatus } from "../models/AccessRequest";
import { BlockchainFactory } from "../blockchain/provider/BlockchainFactory";
import MedicalRecordABI from "../blockchain/ethereum/abi/MedicalRecord.json";
import { ethers } from "ethers";

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
  return res.status(status).json({ success: false, message: error instanceof Error ? error.message : "Clinical request failed" });
}

function transition(request: { status: AccessRequestStatus; history: Array<{ status: AccessRequestStatus; changedAt: Date; changedBy: Types.ObjectId; note?: string }> }, status: AccessRequestStatus, changedBy: Types.ObjectId, note?: string) {
  request.status = status;
  request.history.push({ status, changedAt: new Date(), changedBy, ...(note ? { note } : {}) });
}

export function isPatientApprovalPending(request: { status: AccessRequestStatus; history: Array<{ note?: string }> }): boolean {
  return request.status === "awaiting_patient_signature" &&
    request.history[request.history.length - 1]?.note !== "Revocation awaiting patient signature";
}

export function isPatientRevocationPending(request: { status: AccessRequestStatus; history: Array<{ note?: string }> }): boolean {
  return request.status === "awaiting_patient_signature" &&
    request.history[request.history.length - 1]?.note === "Revocation awaiting patient signature";
}

function populatedUserId(value: unknown): Types.ObjectId {
  if (value && typeof value === "object" && "_id" in value) {
    return new Types.ObjectId(String((value as { _id: unknown })._id));
  }
  return new Types.ObjectId(String(value));
}

export class ClinicalController {
  async listPatients(req: Request, res: Response) {
    try {
      const doctor = actorId(req);
      const appointments = await AppointmentModel.find({ doctorUserId: doctor })
        .populate("patientUserId", "walletAddress did active")
        .sort({ scheduledAt: -1 }).lean();
      const seen = new Map<string, { patient: unknown; appointments: number; lastAppointment: Date }>();
      for (const appointment of appointments) {
        const patient = appointment.patientUserId as unknown as { _id: Types.ObjectId; walletAddress: string; did?: string; active: boolean };
        const current = seen.get(patient._id.toString());
        seen.set(patient._id.toString(), { patient, appointments: (current?.appointments ?? 0) + 1, lastAppointment: current?.lastAppointment ?? appointment.scheduledAt });
      }
      return res.json({ success: true, data: [...seen.values()] });
    } catch (error) { return fail(res, error); }
  }

  async createNote(req: Request, res: Response) {
    try {
      const doctor = actorId(req);
      if (req.auth?.role !== "Doctor") return res.status(403).json({ success: false, message: "Only doctors can create treatment notes" });
      const { patientUserId, appointmentId, note } = req.body ?? {};
      if (!Types.ObjectId.isValid(String(patientUserId)) || typeof note !== "string" || !note.trim()) {
        return res.status(400).json({ success: false, message: "Patient and note are required" });
      }
      const appointment = await AppointmentModel.findOne({
        ...(appointmentId && Types.ObjectId.isValid(String(appointmentId)) ? { _id: appointmentId } : {}),
        doctorUserId: doctor,
        patientUserId,
        status: { $ne: "cancelled" },
      }).select("_id patientUserId");
      if (!appointment) return res.status(403).json({ success: false, message: "Patient is not associated with this doctor" });
      const patient = await UserModel.findOne({ _id: patientUserId, role: "Patient", active: true }).select("_id");
      if (!patient) return res.status(404).json({ success: false, message: "Active patient not found" });
      const created = await TreatmentNoteModel.create({ doctorUserId: doctor, patientUserId: patient._id, appointmentId: appointment._id, note: note.trim() });
      await NotificationModel.create({ userId: patient._id, type: "treatment-note", title: "Treatment note added", message: "Your doctor added a treatment note to an associated appointment.", resourceId: created._id });
      return res.status(201).json({ success: true, data: created });
    } catch (error) { return fail(res, error); }
  }

  async listNotes(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const filter = req.auth?.role === "Doctor" ? { doctorUserId: id } : req.auth?.role === "Patient" ? { patientUserId: id } : { _id: new Types.ObjectId("000000000000000000000000") };
      const notes = await TreatmentNoteModel.find(filter).populate("doctorUserId", "walletAddress").populate("patientUserId", "walletAddress").sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: notes });
    } catch (error) { return fail(res, error); }
  }

  async notifications(req: Request, res: Response) {
    try {
      const notifications = await NotificationModel.find({ userId: actorId(req) }).sort({ createdAt: -1 }).limit(200).lean();
      return res.json({ success: true, data: notifications });
    } catch (error) { return fail(res, error); }
  }

  async markNotificationRead(req: Request, res: Response) {
    try {
      const notification = await NotificationModel.findOneAndUpdate({ _id: req.params.notificationId, userId: actorId(req) }, { $set: { readAt: new Date() } }, { new: true }).lean();
      if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
      return res.json({ success: true, data: notification });
    } catch (error) { return fail(res, error); }
  }

  async searchEligiblePatients(req: Request, res: Response) {
    try {
      const doctor = actorId(req);
      const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
      const appointments = await AppointmentModel.find({ doctorUserId: doctor, status: { $ne: "cancelled" } }).distinct("patientUserId");
      const filter: Record<string, unknown> = { _id: { $in: appointments }, role: "Patient", active: true };
      if (query) filter.walletAddress = { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      const patients = await UserModel.find(filter).select("_id walletAddress did").limit(25).lean();
      return res.json({ success: true, data: patients });
    } catch (error) { return fail(res, error); }
  }

  async createAccessRequest(req: Request, res: Response) {
    try {
      const doctor = actorId(req);
      if (req.auth?.role !== "Doctor") return res.status(403).json({ success: false, message: "Only doctors can request access" });
      const { patientUserId, reason, scope, expiresAt } = req.body ?? {};
      if (!Types.ObjectId.isValid(String(patientUserId)) || String(patientUserId) === doctor.toString() || typeof reason !== "string" || !reason.trim() || scope !== "medical_records") {
        return res.status(400).json({ success: false, message: "A valid patient, reason and supported scope are required" });
      }
      const patient = await UserModel.findOne({ _id: patientUserId, role: "Patient", active: true }).select("_id");
      if (!patient) return res.status(404).json({ success: false, message: "Eligible patient not found" });
      const associated = await AppointmentModel.exists({ doctorUserId: doctor, patientUserId: patient._id, status: { $ne: "cancelled" } });
      if (!associated) return res.status(403).json({ success: false, message: "Patient is not associated with this doctor" });
      if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || new Date(expiresAt) <= new Date())) return res.status(400).json({ success: false, message: "Expiry must be a future date" });
      const duplicate = await AccessRequestModel.exists({ doctorUserId: doctor, patientUserId: patient._id, status: "pending" });
      if (duplicate) return res.status(409).json({ success: false, message: "A pending request already exists" });
      const created = await AccessRequestModel.create({ doctorUserId: doctor, patientUserId: patient._id, reason: reason.trim(), scope, ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}), history: [{ status: "pending", changedAt: new Date(), changedBy: doctor }] });
      await NotificationModel.create({ userId: patient._id, type: "access-request", title: "New medical-record access request", message: `A doctor requested access to your medical records.`, resourceId: created._id });
      return res.status(201).json({ success: true, data: created });
    } catch (error) { return fail(res, error); }
  }

  async listAccessRequests(req: Request, res: Response) {
    try {
      const id = actorId(req);
      const filter = req.auth?.role === "Doctor" ? { doctorUserId: id } : { patientUserId: id };
      const requests = await AccessRequestModel.find(filter).populate("doctorUserId", "walletAddress did").populate("patientUserId", "walletAddress did").sort({ createdAt: -1 }).lean();
      return res.json({ success: true, data: requests });
    } catch (error) { return fail(res, error); }
  }

  private async getPatientRecordIds(req: Request, patientWallet: string): Promise<number[]> {
    const provider = req.careLinkNetwork ? BlockchainFactory.getProviderForChainId(req.careLinkNetwork.chainId) : BlockchainFactory.getProvider();
    const records = await provider.getPatientRecords(patientWallet, patientWallet);
    return records.map((record: any) => Number(record?.recordId ?? record?.[0])).filter((id: number) => Number.isSafeInteger(id) && id > 0);
  }

  async prepareAccessApproval(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "pending" }).populate("doctorUserId", "walletAddress");
      if (!request) return res.status(404).json({ success: false, message: "Pending access request not found" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = await this.getPatientRecordIds(req, patientUser!.walletAddress);
      if (!recordIds.length) return res.status(409).json({ success: false, message: "No patient records are available to authorize" });
      const network = req.careLinkNetwork;
      if (!network) return res.status(503).json({ success: false, message: "Select a supported EVM network before authorizing access" });
      const iface = new ethers.Interface(MedicalRecordABI.abi);
      const transactions = recordIds.map((recordId) => ({ recordId, to: network.medicalRecordAddress, data: iface.encodeFunctionData("grantAccess", [recordId, doctor.walletAddress]), chainId: network.chainId }));
      transition(request, "awaiting_patient_signature", patient);
      await request.save();
      return res.json({ success: true, data: { requestId: request._id, transactions } });
    } catch (error) { return fail(res, error); }
  }

  async confirmAccessApproval(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "awaiting_patient_signature" }).populate("doctorUserId", "walletAddress");
      if (!request || !isPatientApprovalPending(request)) return res.status(404).json({ success: false, message: "Access approval is not awaiting signature" });
      const hashes = Array.isArray(req.body?.transactionHashes) ? req.body.transactionHashes.filter((hash: unknown) => typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)) : [];
      if (!hashes.length) return res.status(400).json({ success: false, message: "Confirmed transaction hashes are required" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = await this.getPatientRecordIds(req, patientUser!.walletAddress);
      const provider = req.careLinkNetwork ? BlockchainFactory.getProviderForChainId(req.careLinkNetwork.chainId) : BlockchainFactory.getProvider();
      const authorized: boolean[] = await Promise.all(recordIds.map((id) => provider.isAuthorizedDoctor(id, doctor.walletAddress)));
      if (!authorized.length || authorized.some((value: boolean) => value !== true)) return res.status(409).json({ success: false, message: "On-chain authorization is not yet confirmed" });
      request.transactionHashes = hashes;
      transition(request, "active", patient);
      await request.save();
      await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-granted", title: "Medical-record access granted", message: "A patient confirmed your medical-record access request.", resourceId: request._id });
      return res.json({ success: true, data: request });
    } catch (error) { return fail(res, error); }
  }

  async rejectAccessRequest(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "pending" });
      if (!request) return res.status(404).json({ success: false, message: "Pending access request not found" });
      transition(request, "rejected", patient);
      await request.save();
      await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-rejected", title: "Medical-record access request rejected", message: "A patient rejected your medical-record access request.", resourceId: request._id });
      return res.json({ success: true, data: request });
    } catch (error) { return fail(res, error); }
  }

  async prepareAccessRevocation(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "active" }).populate("doctorUserId", "walletAddress");
      if (!request) return res.status(404).json({ success: false, message: "Active access request not found" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = await this.getPatientRecordIds(req, patientUser!.walletAddress);
      const network = req.careLinkNetwork;
      if (!network) return res.status(503).json({ success: false, message: "Select a supported EVM network before revoking access" });
      const iface = new ethers.Interface(MedicalRecordABI.abi);
      const transactions = recordIds.map((recordId) => ({ recordId, to: network.medicalRecordAddress, data: iface.encodeFunctionData("revokeAccess", [recordId, doctor.walletAddress]), chainId: network.chainId }));
      transition(request, "awaiting_patient_signature", patient, "Revocation awaiting patient signature");
      await request.save();
      return res.json({ success: true, data: { requestId: request._id, transactions } });
    } catch (error) { return fail(res, error); }
  }

  async confirmAccessRevocation(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "awaiting_patient_signature" }).populate("doctorUserId", "walletAddress");
      if (!request || !isPatientRevocationPending(request)) return res.status(404).json({ success: false, message: "Access revocation is not awaiting signature" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = await this.getPatientRecordIds(req, patientUser!.walletAddress);
      const provider = req.careLinkNetwork ? BlockchainFactory.getProviderForChainId(req.careLinkNetwork.chainId) : BlockchainFactory.getProvider();
      const authorized: boolean[] = await Promise.all(recordIds.map((id) => provider.isAuthorizedDoctor(id, doctor.walletAddress)));
      if (authorized.some((value: boolean) => value === true)) return res.status(409).json({ success: false, message: "On-chain revocation is not yet confirmed" });
      transition(request, "revoked", patient);
      await request.save();
      await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-revoked", title: "Medical-record access revoked", message: "A patient revoked your medical-record access.", resourceId: request._id });
      return res.json({ success: true, data: request });
    } catch (error) { return fail(res, error); }
  }
}
