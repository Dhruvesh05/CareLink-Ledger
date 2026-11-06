import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { getAddress, Interface, JsonRpcProvider, verifyMessage } from "ethers";
import UserModel from "../models/User";
import AppointmentModel from "../models/Appointment";
import TreatmentNoteModel from "../models/TreatmentNote";
import NotificationModel from "../models/Notification";
import AccessRequestModel, {
  type AccessRecordReference,
  type AccessPermissionType,
  type AccessRequestStatus,
} from "../models/AccessRequest";
import RecordCommentModel from "../models/RecordComment";
import MedicalRecordModel from "../models/MedicalRecordModel";
import { BlockchainFactory } from "../blockchain/provider/BlockchainFactory";
import MedicalRecordABI from "../blockchain/ethereum/abi/MedicalRecord.json";
import { getDefaultSupportedEvmNetwork } from "../blockchain/config/supportedNetworks";

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

const CONSENT_DOMAIN = "CareLink Ledger Consent";

function selectedNetwork(req: Request) {
  if (req.careLinkNetwork) return req.careLinkNetwork;
  return getDefaultSupportedEvmNetwork();
}

function requestRecordRefs(request: { recordRefs?: AccessRecordReference[]; recordIds?: number[] }): AccessRecordReference[] {
  return (request.recordRefs ?? []).map((reference) => ({
    chainId: reference.chainId,
    contractAddress: reference.contractAddress.toLowerCase(),
    recordId: reference.recordId,
  }));
}

function consentMessage(requestId: string, patient: string, doctor: string, refs: AccessRecordReference[], expiresAt?: Date, nonce?: string, action = "APPROVE"): string {
  const records = refs
    .map((reference) => `${reference.chainId}:${reference.contractAddress.toLowerCase()}:${reference.recordId}`)
    .sort()
    .join("|");
  return [
    CONSENT_DOMAIN,
    "Version: 1",
    `Request: ${requestId}`,
    `Patient: ${getAddress(patient)}`,
    `Doctor: ${getAddress(doctor)}`,
    "Permission: COMMENT_ONLY",
    `Action: ${action}`,
    `Records: ${records}`,
    `Expires: ${expiresAt?.toISOString() ?? "none"}`,
    `Nonce: ${nonce}`,
  ].join("\n");
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

  async createRecordComment(req: Request, res: Response) {
    try {
      const doctor = actorId(req);
      if (req.auth?.role !== "Doctor") return res.status(403).json({ success: false, message: "Only doctors can create record comments" });
      const recordId = Number(req.body?.recordId);
      const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
      if (!Number.isSafeInteger(recordId) || recordId <= 0 || !content) {
        return res.status(400).json({ success: false, message: "A valid record ID and comment are required" });
      }
      const network = selectedNetwork(req);
      const request = await AccessRequestModel.findOne({
        doctorUserId: doctor,
        patientUserId: req.body?.patientUserId,
        status: "active",
        permissionType: "COMMENT_ONLY",
        recordIds: recordId,
        "recordRefs": { $elemMatch: { chainId: network.chainId, contractAddress: network.medicalRecordAddress.toLowerCase(), recordId } },
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).lean().exec();
      if (!request) return res.status(403).json({ success: false, message: "Active comment-only authorization not found for this record" });
      const reference = requestRecordRefs(request).find((item) => item.recordId === recordId);
      if (!reference) return res.status(403).json({ success: false, message: "Record scope is not authorized" });
      const created = await RecordCommentModel.create({
        patientUserId: request.patientUserId,
        doctorUserId: doctor,
        accessRequestId: request._id,
        recordRef: reference,
        content,
      });
      return res.status(201).json({ success: true, data: created });
    } catch (error) { return fail(res, error); }
  }

  async listRecordComments(req: Request, res: Response) {
    try {
      const actor = actorId(req);
      const filter = req.auth?.role === "Patient"
        ? { patientUserId: actor }
        : req.auth?.role === "Doctor"
          ? { doctorUserId: actor }
          : { _id: new Types.ObjectId("000000000000000000000000") };
      const comments = await RecordCommentModel.find(filter)
        .select("patientUserId doctorUserId accessRequestId recordRef content createdAt")
        .populate("doctorUserId", "walletAddress did")
        .populate("patientUserId", "walletAddress did")
        .sort({ createdAt: -1 })
        .lean();
      const activeComments = [];
      for (const comment of comments) {
        const request = await AccessRequestModel.findOne({
          _id: comment.accessRequestId,
          status: "active",
          permissionType: "COMMENT_ONLY",
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
        }).select("_id");
        if (request || req.auth?.role === "Patient") activeComments.push(comment);
      }
      return res.json({ success: true, data: activeComments });
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
      const { patientUserId, reason, scope, permissionType, recordIds, expiresAt } = req.body ?? {};
      const normalizedRecordIds = Array.isArray(recordIds)
        ? [...new Set(recordIds.map((value: unknown) => Number(value)))]
        : [];
      if (
        !Types.ObjectId.isValid(String(patientUserId)) ||
        String(patientUserId) === doctor.toString() ||
        typeof reason !== "string" ||
        !reason.trim() ||
        scope !== "medical_records" ||
        !["READ_ONLY", "COMMENT_ONLY"].includes(permissionType) ||
        normalizedRecordIds.length === 0 ||
        normalizedRecordIds.some((recordId) => !Number.isSafeInteger(recordId) || recordId <= 0)
      ) {
        return res.status(400).json({ success: false, message: "A valid patient, permission type and one or more record IDs are required" });
      }
      const patient = await UserModel.findOne({ _id: patientUserId, role: "Patient", active: true }).select("_id");
      if (!patient) return res.status(404).json({ success: false, message: "Eligible patient not found" });
      const associated = await AppointmentModel.exists({ doctorUserId: doctor, patientUserId: patient._id, status: { $ne: "cancelled" } });
      if (!associated) return res.status(403).json({ success: false, message: "Patient is not associated with this doctor" });
      if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || new Date(expiresAt) <= new Date())) return res.status(400).json({ success: false, message: "Expiry must be a future date" });
      const patientUser = await UserModel.findById(patient._id).select("walletAddress");
      const recordRefs = await this.getPatientRecordRefs(req, patientUser!.walletAddress, normalizedRecordIds);
      const duplicate = await AccessRequestModel.exists({ doctorUserId: doctor, patientUserId: patient._id, status: "pending" });
      if (duplicate) return res.status(409).json({ success: false, message: "A pending request already exists" });
      const created = await AccessRequestModel.create({
        doctorUserId: doctor,
        patientUserId: patient._id,
        reason: reason.trim(),
        scope,
        permissionType: permissionType as AccessPermissionType,
        recordIds: normalizedRecordIds,
        recordRefs,
        ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
        history: [{ status: "pending", changedAt: new Date(), changedBy: doctor }],
      });
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
    const network = selectedNetwork(req);
    const provider = BlockchainFactory.getProviderForChainId(network.chainId);
    const records = await provider.getPatientRecords(patientWallet, patientWallet);
    return records.map((record: any) => Number(record?.recordId ?? record?.[0])).filter((id: number) => Number.isSafeInteger(id) && id > 0);
  }

  private async getPatientRecordRefs(
    req: Request,
    patientWallet: string,
    recordIds: number[],
  ): Promise<AccessRecordReference[]> {
    const network = selectedNetwork(req);
    const ownedIds = await this.getPatientRecordIds(req, patientWallet);
    if (recordIds.some((recordId) => !ownedIds.includes(recordId))) {
      throw Object.assign(new Error("The request contains records that are not owned by the patient"), { status: 403 });
    }
    const metadata = await MedicalRecordModel.find({
      chainId: network.chainId,
      contractAddress: network.medicalRecordAddress.toLowerCase(),
      recordId: { $in: recordIds },
    }).select("recordId patientWallet").lean().exec();
    const patientAddress = patientWallet.toLowerCase();
    if (metadata.some((record) => record.patientWallet.toLowerCase() !== patientAddress)) {
      throw Object.assign(new Error("The request contains records that are not owned by the patient"), { status: 403 });
    }

    return recordIds.map((recordId) => ({
      chainId: network.chainId,
      contractAddress: network.medicalRecordAddress.toLowerCase(),
      recordId,
    }));
  }

  private async verifyConsentTransactions(
    network: ReturnType<typeof selectedNetwork>,
    refs: AccessRecordReference[],
    doctorWallet: string,
    patientWallet: string,
    hashes: string[],
    functionName: "grantAccess" | "revokeAccess",
  ): Promise<void> {
    const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
    const iface = new Interface(MedicalRecordABI.abi);
    const expected = new Set(refs.map((reference) => reference.recordId));
    const seen = new Set<number>();
    const expectedPatient = getAddress(patientWallet);
    const expectedDoctor = getAddress(doctorWallet);

    for (const hash of hashes) {
      const [transaction, receipt] = await Promise.all([
        provider.getTransaction(hash),
        provider.getTransactionReceipt(hash),
      ]);
      if (!transaction || !receipt || receipt.status !== 1 || transaction.to?.toLowerCase() !== network.medicalRecordAddress.toLowerCase()) {
        throw Object.assign(new Error("Consent transaction could not be verified"), { status: 409 });
      }
      if (Number(transaction.chainId) !== network.chainId || transaction.from.toLowerCase() !== expectedPatient.toLowerCase()) {
        throw Object.assign(new Error("Consent transaction chain or signer mismatch"), { status: 409 });
      }
      const parsed = iface.parseTransaction({ data: transaction.data, value: transaction.value });
      if (!parsed || parsed.name !== functionName) {
        throw Object.assign(new Error("Consent transaction function mismatch"), { status: 409 });
      }
      const recordId = Number(parsed.args[0]);
      if (!expected.has(recordId) || getAddress(String(parsed.args[1])) !== expectedDoctor || seen.has(recordId)) {
        throw Object.assign(new Error("Consent transaction arguments do not match the request"), { status: 409 });
      }
      seen.add(recordId);
    }

    if (seen.size !== expected.size) {
      throw Object.assign(new Error("Every requested record requires a verified consent transaction"), { status: 409 });
    }
  }

  async prepareAccessApproval(req: Request, res: Response) {
    try {
      const patient = actorId(req);
      const request = await AccessRequestModel.findOne({ _id: req.params.requestId, patientUserId: patient, status: "pending" }).populate("doctorUserId", "walletAddress");
      if (!request) return res.status(404).json({ success: false, message: "Pending access request not found" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = request.recordIds ?? [];
      const recordRefs = requestRecordRefs(request);
      if (!recordIds.length || !recordRefs.length || recordRefs.length !== recordIds.length) {
        return res.status(409).json({ success: false, message: "This historical request requires fresh patient approval with explicit record references" });
      }
      const network = selectedNetwork(req);
      if (recordRefs.some((reference) => reference.chainId !== network.chainId || reference.contractAddress !== network.medicalRecordAddress.toLowerCase())) {
        return res.status(409).json({ success: false, message: "The request network does not match the selected network" });
      }
      await this.getPatientRecordRefs(req, patientUser!.walletAddress, recordIds);
      if (request.permissionType === "COMMENT_ONLY") {
        const nonce = randomBytes(24).toString("hex");
        const message = consentMessage(String(request._id), patientUser!.walletAddress, doctor.walletAddress, recordRefs, request.expiresAt, nonce);
        request.consentNonce = nonce;
        request.consentMessage = message;
        request.consentDomain = CONSENT_DOMAIN;
        transition(request, "awaiting_patient_signature", patient);
        await request.save();
        return res.json({ success: true, data: { requestId: request._id, mode: "signature", domain: CONSENT_DOMAIN, nonce, message, expiresAt: request.expiresAt } });
      }
      if (request.permissionType !== "READ_ONLY") {
        return res.status(409).json({ success: false, message: "Unsupported permission type" });
      }
      const iface = new Interface(MedicalRecordABI.abi);
      const transactions = recordRefs.map((reference) => ({ recordId: reference.recordId, to: network.medicalRecordAddress, data: iface.encodeFunctionData("grantAccess", [reference.recordId, doctor.walletAddress]), chainId: network.chainId }));
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
      if (request.permissionType === "COMMENT_ONLY") {
        const signature = typeof req.body?.signature === "string" ? req.body.signature : "";
        const patientUser = await UserModel.findById(patient).select("walletAddress");
        const doctor = request.doctorUserId as unknown as { walletAddress: string };
        if (!signature || !request.consentNonce || !request.consentMessage || !patientUser?.walletAddress) {
          return res.status(400).json({ success: false, message: "A patient consent signature is required" });
        }
        let signer: string;
        try {
          signer = verifyMessage(request.consentMessage, signature);
        } catch {
          return res.status(400).json({ success: false, message: "Invalid consent signature" });
        }
        if (signer.toLowerCase() !== patientUser.walletAddress.toLowerCase() ||
            request.consentMessage !== consentMessage(String(request._id), patientUser.walletAddress, doctor.walletAddress, requestRecordRefs(request), request.expiresAt, request.consentNonce)) {
          return res.status(403).json({ success: false, message: "Consent signature does not match the request" });
        }
        request.consentSignature = signature;
        request.consentApprovedAt = new Date();
        transition(request, "active", patient);
        await request.save();
        await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-granted", title: "Comment access granted", message: "A patient approved your comment-only access request.", resourceId: request._id });
        return res.json({ success: true, data: request });
      }
      const hashes = Array.isArray(req.body?.transactionHashes) ? req.body.transactionHashes.filter((hash: unknown) => typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)) : [];
      if (!hashes.length) return res.status(400).json({ success: false, message: "Confirmed transaction hashes are required" });
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = request.recordIds ?? [];
      const refs = requestRecordRefs(request);
      const network = selectedNetwork(req);
      if (!patientUser?.walletAddress || !refs.length) return res.status(409).json({ success: false, message: "Explicit record references are required" });
      await this.verifyConsentTransactions(network, refs, doctor.walletAddress, patientUser.walletAddress, hashes, "grantAccess");
      const provider = BlockchainFactory.getProviderForChainId(network.chainId);
      const authorized: boolean[] = await Promise.all(recordIds.map((id: number) => provider.isAuthorizedDoctor(id, doctor.walletAddress)));
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
      if (request.permissionType === "COMMENT_ONLY") {
        const patientUser = await UserModel.findById(patient).select("walletAddress");
        const doctor = request.doctorUserId as unknown as { walletAddress: string };
        const refs = requestRecordRefs(request);
        const nonce = randomBytes(24).toString("hex");
        const message = consentMessage(String(request._id), patientUser!.walletAddress, doctor.walletAddress, refs, request.expiresAt, nonce, "REVOKE");
        request.revocationNonce = nonce;
        request.revocationMessage = message;
        request.consentDomain = CONSENT_DOMAIN;
        transition(request, "awaiting_patient_signature", patient, "Revocation awaiting patient signature");
        await request.save();
        return res.json({ success: true, data: { requestId: request._id, mode: "signature", domain: CONSENT_DOMAIN, nonce, message } });
      }
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const recordIds = request.recordIds ?? [];
      const refs = requestRecordRefs(request);
      const network = selectedNetwork(req);
      if (!refs.length || refs.length !== recordIds.length) return res.status(409).json({ success: false, message: "Explicit record references are required" });
      if (refs.some((reference) => reference.chainId !== network.chainId || reference.contractAddress !== network.medicalRecordAddress.toLowerCase())) {
        return res.status(409).json({ success: false, message: "The request network does not match the selected network" });
      }
      const iface = new Interface(MedicalRecordABI.abi);
      const transactions = refs.map((reference) => ({ recordId: reference.recordId, to: network.medicalRecordAddress, data: iface.encodeFunctionData("revokeAccess", [reference.recordId, doctor.walletAddress]), chainId: network.chainId }));
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
      if (request.permissionType === "COMMENT_ONLY") {
        const signature = typeof req.body?.signature === "string" ? req.body.signature : "";
        const patientUser = await UserModel.findById(patient).select("walletAddress");
        const doctor = request.doctorUserId as unknown as { walletAddress: string };
        if (!signature || !request.revocationNonce || !request.revocationMessage || !patientUser?.walletAddress) {
          return res.status(400).json({ success: false, message: "A patient revocation signature is required" });
        }
        let signer: string;
        try {
          signer = verifyMessage(request.revocationMessage, signature);
        } catch {
          return res.status(400).json({ success: false, message: "Invalid revocation signature" });
        }
        if (signer.toLowerCase() !== patientUser.walletAddress.toLowerCase() ||
            request.revocationMessage !== consentMessage(String(request._id), patientUser.walletAddress, doctor.walletAddress, requestRecordRefs(request), request.expiresAt, request.revocationNonce, "REVOKE")) {
          return res.status(403).json({ success: false, message: "Revocation signature does not match the request" });
        }
        request.revocationSignature = signature;
        request.revokedAt = new Date();
        transition(request, "revoked", patient);
        await request.save();
        await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-revoked", title: "Comment access revoked", message: "A patient revoked your comment-only access.", resourceId: request._id });
        return res.json({ success: true, data: request });
      }
      const patientUser = await UserModel.findById(patient).select("walletAddress");
      const doctor = request.doctorUserId as unknown as { walletAddress: string };
      const hashes = Array.isArray(req.body?.transactionHashes) ? req.body.transactionHashes.filter((hash: unknown) => typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash)) : [];
      if (!hashes.length) return res.status(400).json({ success: false, message: "Confirmed transaction hashes are required" });
      const recordIds = request.recordIds ?? [];
      const refs = requestRecordRefs(request);
      const network = selectedNetwork(req);
      if (!patientUser?.walletAddress || !refs.length) return res.status(409).json({ success: false, message: "Explicit record references are required" });
      await this.verifyConsentTransactions(network, refs, doctor.walletAddress, patientUser.walletAddress, hashes, "revokeAccess");
      const provider = BlockchainFactory.getProviderForChainId(network.chainId);
      const authorized: boolean[] = await Promise.all(recordIds.map((id: number) => provider.isAuthorizedDoctor(id, doctor.walletAddress)));
      if (authorized.some((value: boolean) => value === true)) return res.status(409).json({ success: false, message: "On-chain revocation is not yet confirmed" });
      transition(request, "revoked", patient);
      await request.save();
      await NotificationModel.create({ userId: populatedUserId(request.doctorUserId), type: "access-revoked", title: "Medical-record access revoked", message: "A patient revoked your medical-record access.", resourceId: request._id });
      return res.json({ success: true, data: request });
    } catch (error) { return fail(res, error); }
  }
}
