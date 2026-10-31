import type { Request, Response } from "express";
import UserModel from "../models/User";
import UserProfileModel from "../models/UserProfile";
import MedicalRecordModel from "../models/MedicalRecordModel";
import CrossChainAuditModel from "../models/CrossChainAudit";
import AdminAuditEventModel from "../models/AdminAuditEvent";
import HospitalActivityLogModel from "../models/HospitalActivityLog";
import AppointmentModel from "../models/Appointment";
import InvoiceModel from "../models/Invoice";
import { getDatabaseHealth } from "../config/database";
import { getSupportedEvmNetwork } from "../blockchain/config/supportedNetworks";
import { ipfsClient } from "../ipfs/client/IPFSClient";
import { ipfsConfig } from "../ipfs/config/ipfs.config";
import { ethers } from "ethers";

async function evmHealth(chainId: 11155111 | 80002) {
  const startedAt = Date.now();
  try {
    const network = getSupportedEvmNetwork(chainId);
    const provider = new ethers.JsonRpcProvider(network.rpcUrl, chainId, { staticNetwork: true });
    const blockHeight = await Promise.race([
      provider.getBlockNumber(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RPC health check timed out")), 10_000)),
    ]);
    return { name: network.name, chainId, status: "connected", rpcReady: true, blockHeight, checkedAt: new Date().toISOString(), latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { name: chainId === 11155111 ? "Ethereum Sepolia" : "Polygon Amoy", chainId, status: "unavailable", rpcReady: false, blockHeight: null, checkedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "RPC health check failed" };
  }
}

export function classifyCrossChainStatus(status: string): "submitted" | "processing" | "confirmed" | "failed" | "unknown" {
  if (status === "accepted") return "submitted";
  if (status === "relaying") return "processing";
  if (status === "confirmed") return "confirmed";
  if (status === "failed" || status === "duplicate") return "failed";
  return "unknown";
}

export class AdminController {
  async stats(_req: Request, res: Response) {
    const [users, patients, doctors, hospitals, activeUsers, medicalRecords, crossChain, failedOperations, auditEvents, roleDistribution, registrationTrend, transactionStatus, auditCategory] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "Patient" }),
      UserModel.countDocuments({ role: "Doctor" }),
      UserModel.countDocuments({ role: "Hospital" }),
      UserModel.countDocuments({ active: true }),
      MedicalRecordModel.countDocuments(),
      CrossChainAuditModel.countDocuments(),
      AdminAuditEventModel.countDocuments({ result: "failure" }),
      AdminAuditEventModel.countDocuments(),
      UserModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      UserModel.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } },
      ]),
      CrossChainAuditModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      AdminAuditEventModel.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    return res.json({ success: true, data: {
      users, patients, doctors, hospitals, activeUsers, medicalRecords, crossChain, failedOperations, auditEvents,
      verifiedDoctors: null, verifiedHospitals: null, pendingDoctors: null, pendingHospitals: null,
      roleDistribution, registrationTrend, transactionStatus, auditCategory,
    } });
  }

  async users(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.role === "string" && ["Admin", "Patient", "Doctor", "Hospital"].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.active === "true" || req.query.active === "false") filter.active = req.query.active === "true";
    if (typeof req.query.q === "string" && req.query.q.trim()) filter.walletAddress = { $regex: req.query.q.trim(), $options: "i" };
    const users = await UserModel.find(filter).select("walletAddress role active createdAt updatedAt").sort({ createdAt: -1 }).limit(500).lean();
    const profileIds = users.map((user) => user._id);
    const profiles = await UserProfileModel.find({ userId: { $in: profileIds } }).select("userId displayName").lean();
    const names = new Map(profiles.map((profile) => [profile.userId.toString(), profile.displayName]));
    return res.json({
      success: true,
      data: users.map((user) => ({ ...user, displayName: names.get(user._id.toString()) ?? "" })),
    });
  }

  async setStatus(req: Request, res: Response) {
    const active = req.body?.active;
    if (typeof active !== "boolean") return res.status(400).json({ success: false, message: "active must be boolean" });
    if (req.params.userId === req.auth?.userId && !active) {
      return res.status(400).json({ success: false, message: "Administrators cannot deactivate their own account" });
    }
    const user = await UserModel.findByIdAndUpdate(req.params.userId, { $set: { active } }, { new: true })
      .select("walletAddress role active createdAt updatedAt");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await AdminAuditEventModel.create({ category: "administration", actorUserId: req.auth?.userId, actorRole: req.auth?.role, event: active ? "Account activated" : "Account deactivated", resource: "user", resourceId: user._id.toString(), result: "success" });
    return res.json({ success: true, data: user });
  }

  async audit(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.category === "string" && ["access", "consent", "medical-records", "verification", "blockchain", "administration", "failure"].includes(req.query.category)) filter.category = req.query.category;
    if (req.query.result === "failure" || req.query.result === "success") filter.result = req.query.result;
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const escaped = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { event: { $regex: escaped, $options: "i" } },
        { resource: { $regex: escaped, $options: "i" } },
        { transactionReference: { $regex: escaped, $options: "i" } },
      ];
    }
    if (typeof req.query.from === "string" && !Number.isNaN(Date.parse(req.query.from))) {
      filter.createdAt = { ...(filter.createdAt as object ?? {}), $gte: new Date(req.query.from) };
    }
    if (typeof req.query.to === "string" && !Number.isNaN(Date.parse(req.query.to))) {
      filter.createdAt = { ...(filter.createdAt as object ?? {}), $lte: new Date(req.query.to) };
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const [events, total] = await Promise.all([
      AdminAuditEventModel.find(filter).populate("actorUserId", "walletAddress role").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AdminAuditEventModel.countDocuments(filter),
    ]);
    return res.json({ success: true, data: { events, total, page, limit, pages: Math.ceil(total / limit) } });
  }

  async auditStats(_req: Request, res: Response) {
    const [total, failures, categories] = await Promise.all([
      AdminAuditEventModel.countDocuments(),
      AdminAuditEventModel.countDocuments({ result: "failure" }),
      AdminAuditEventModel.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    const categoryMap = Object.fromEntries(categories.map((item) => [item._id, item.count]));
    return res.json({ success: true, data: { total, failures, access: categoryMap.access ?? 0, consent: categoryMap.consent ?? 0, categories } });
  }

  async crossChain(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.status === "string") filter.status = req.query.status;
    if (typeof req.query.source === "string") filter.sourceChain = req.query.source;
    if (typeof req.query.destination === "string") filter.destinationChain = req.query.destination;
    if (typeof req.query.wallet === "string" && req.query.wallet.trim()) filter.initiatingWallet = { $regex: req.query.wallet.trim(), $options: "i" };
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const escaped = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { messageId: { $regex: escaped, $options: "i" } },
        { transactionHash: { $regex: escaped, $options: "i" } },
        { destinationTransactionHash: { $regex: escaped, $options: "i" } },
      ];
    }
    if (typeof req.query.from === "string" && !Number.isNaN(Date.parse(req.query.from))) filter.createdAt = { $gte: new Date(req.query.from) };
    if (typeof req.query.to === "string" && !Number.isNaN(Date.parse(req.query.to))) filter.createdAt = { ...(filter.createdAt as object ?? {}), $lte: new Date(req.query.to) };
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const [items, total, grouped] = await Promise.all([
      CrossChainAuditModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CrossChainAuditModel.countDocuments(filter),
      CrossChainAuditModel.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    return res.json({ success: true, data: { items, total, page, limit, pages: Math.ceil(total / limit), grouped } });
  }

  async reports(req: Request, res: Response) {
    const type = typeof req.query.type === "string" ? req.query.type : "users";
    const rows = type === "appointments"
      ? await AppointmentModel.find().select("patientUserId doctorUserId hospitalUserId scheduledAt status reason").sort({ scheduledAt: -1 }).limit(5000).lean()
      : type === "invoices"
        ? await InvoiceModel.find().select("invoiceNumber hospitalUserId patientUserId amountMinor currency status issueDate dueAt").sort({ issueDate: -1 }).limit(5000).lean()
        : type === "medical-records"
          ? await MedicalRecordModel.find().select("recordId patientWallet category cid fileSize transactionHash createdAt").sort({ createdAt: -1 }).limit(5000).lean()
          : type === "blockchain"
            ? await CrossChainAuditModel.find().sort({ createdAt: -1 }).limit(5000).lean()
            : type === "audit"
              ? await AdminAuditEventModel.find().sort({ createdAt: -1 }).limit(5000).lean()
              : type === "hospital-activity"
                ? await HospitalActivityLogModel.find().sort({ createdAt: -1 }).limit(5000).lean()
                : type === "verifications"
                  ? await AdminAuditEventModel.find({ category: "verification" }).sort({ createdAt: -1 }).limit(5000).lean()
            : await UserModel.find().select("walletAddress role active createdAt updatedAt").sort({ createdAt: -1 }).limit(5000).lean();
    const headers = rows.length ? Object.keys(rows[0]).filter((key) => key !== "__v") : ["message"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify((row as Record<string, unknown>)[header] ?? "")).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="carelink-${type}-report.csv"`);
    return res.send(csv);
  }

  async monitoring(_req: Request, res: Response) {
    const [crossChain, recentActivity, ethereum, polygon, ipfsReachable] = await Promise.all([
      CrossChainAuditModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      HospitalActivityLogModel.countDocuments(),
      evmHealth(11155111),
      evmHealth(80002),
      ipfsClient.ping(),
    ]);
    return res.json({ success: true, data: {
      database: getDatabaseHealth(),
      crossChain,
      hospitalActivity: recentActivity,
      networks: { ethereum, polygon, fabric: { status: "unknown", configured: Boolean(process.env.FABRIC_PEER_ENDPOINT && process.env.FABRIC_CHANNEL && process.env.FABRIC_CHAINCODE), message: "Fabric gateway does not expose a non-mutating health query" } },
      ipfs: { provider: ipfsConfig.provider, api: { status: ipfsReachable ? "connected" : "unavailable", endpoint: ipfsConfig.apiUrl }, gateway: { status: "unknown", endpoint: ipfsConfig.gatewayUrl }, checkedAt: new Date().toISOString() },
    } });
  }

  async ipfsCid(req: Request, res: Response) {
    const cid = typeof req.params.cid === "string" ? req.params.cid.trim() : "";
    if (!cid || /\s/.test(cid)) return res.status(400).json({ success: false, message: "A valid CID is required" });
    try {
      const pinned = await ipfsClient.isPinned(cid);
      let retrievable = false;
      try {
        const response = await fetch(`${ipfsConfig.gatewayUrl.replace(/\/$/, "")}/${encodeURIComponent(cid)}`, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
        retrievable = response.ok;
      } catch {
        retrievable = false;
      }
      return res.json({ success: true, data: { cid, pinned, retrievable, gateway: ipfsConfig.gatewayUrl, checkedAt: new Date().toISOString() } });
    } catch (error) {
      return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "Unable to check IPFS CID status" });
    }
  }
}
