import type { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../models/User";
import HospitalDepartmentModel from "../models/HospitalDepartment";
import HospitalDoctorAssociationModel from "../models/HospitalDoctorAssociation";
import HospitalActivityLogModel from "../models/HospitalActivityLog";
import AppointmentModel from "../models/Appointment";
import InvoiceModel from "../models/Invoice";

function hospitalId(req: Request): Types.ObjectId {
  if (!req.auth?.userId || !Types.ObjectId.isValid(req.auth.userId)) {
    throw Object.assign(new Error("Authenticated hospital not found"), { status: 401 });
  }
  return new Types.ObjectId(req.auth.userId);
}

function sendError(res: Response, error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status) || 500
    : 500;
  return res.status(status).json({
    success: false,
    message: error instanceof Error ? error.message : "Organization operation failed",
  });
}

async function log(req: Request, action: string, resource: string, resourceId?: Types.ObjectId, metadata?: Record<string, unknown>) {
  if (!req.auth?.userId || !Types.ObjectId.isValid(req.auth.userId)) return;
  await HospitalActivityLogModel.create({
    hospitalUserId: new Types.ObjectId(req.auth.userId),
    actorUserId: new Types.ObjectId(req.auth.userId),
    actorRole: req.auth.role ?? "Hospital",
    action,
    resource,
    resourceId,
    metadata,
  });
}

export class OrganizationController {
  async listDepartments(req: Request, res: Response) {
    try {
      const filter: Record<string, unknown> = { hospitalUserId: hospitalId(req) };
      if (req.query.active !== "all") filter.active = true;
      if (typeof req.query.q === "string" && req.query.q.trim()) filter.name = { $regex: req.query.q.trim(), $options: "i" };
      const departments = await HospitalDepartmentModel.find(filter)
        .sort({ name: 1 })
        .lean();
      return res.json({ success: true, data: departments });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async createDepartment(req: Request, res: Response) {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
      if (!name) return res.status(400).json({ success: false, message: "Department name is required" });
      const department = await HospitalDepartmentModel.create({
        hospitalUserId: hospitalId(req),
        name,
        description,
      });
      await log(req, "department.created", "department", department._id);
      return res.status(201).json({ success: true, data: department });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000) {
        return res.status(409).json({ success: false, message: "Department already exists" });
      }
      return sendError(res, error);
    }
    }

  async updateDepartment(req: Request, res: Response) {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
      const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
      const update: Record<string, unknown> = {};
      if (name !== undefined) {
        if (!name) return res.status(400).json({ success: false, message: "Department name cannot be empty" });
        update.name = name;
      }
      if (description !== undefined) update.description = description;
      if (typeof req.body?.active === "boolean") update.active = req.body.active;
      const department = await HospitalDepartmentModel.findOneAndUpdate(
        { _id: req.params.departmentId, hospitalUserId: hospitalId(req) },
        { $set: update },
        { new: true, runValidators: true },
      );
      if (!department) return res.status(404).json({ success: false, message: "Department not found" });
      await log(req, department.active ? "department.updated" : "department.deactivated", "department", department._id);
      return res.json({ success: true, data: department });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000) {
        return res.status(409).json({ success: false, message: "Department already exists" });
      }
      return sendError(res, error);
    }
  }

  async listAssociations(req: Request, res: Response) {
    try {
      const associations = await HospitalDoctorAssociationModel.find({ hospitalUserId: hospitalId(req) })
        .populate("doctorUserId", "walletAddress role active")
        .populate("departmentId", "name")
        .sort({ updatedAt: -1 })
        .lean();
      return res.json({ success: true, data: associations });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async doctorDirectory(req: Request, res: Response) {
    try {
      const hospital = hospitalId(req);
      const query: Record<string, unknown> = { role: "Doctor", active: true };
      if (typeof req.query.q === "string" && req.query.q.trim()) {
        query.$or = [
          { walletAddress: { $regex: req.query.q.trim(), $options: "i" } },
          { did: { $regex: req.query.q.trim(), $options: "i" } },
        ];
      }
      const doctors = await UserModel.find(query).select("walletAddress did role active").sort({ createdAt: -1 }).limit(100).lean();
      const associations = await HospitalDoctorAssociationModel.find({ hospitalUserId: hospital }).lean();
      const byDoctor = new Map(associations.map((association) => [association.doctorUserId.toString(), association]));
      return res.json({ success: true, data: doctors.map((doctor) => ({
        ...doctor,
        association: byDoctor.get(doctor._id.toString()) ?? null,
        verificationStatus: doctor.active ? "active-account" : "inactive-account",
      })) });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async createAssociation(req: Request, res: Response) {
    try {
      const doctorUserId = req.body?.doctorUserId;
      if (typeof doctorUserId !== "string" || !Types.ObjectId.isValid(doctorUserId)) {
        return res.status(400).json({ success: false, message: "A valid doctorUserId is required" });
      }
      const doctor = await UserModel.findOne({ _id: doctorUserId, role: "Doctor", active: true }).select("_id");
      if (!doctor) return res.status(404).json({ success: false, message: "Active doctor not found" });
      const departmentId = req.body?.departmentId;
      if (departmentId !== undefined && (!Types.ObjectId.isValid(departmentId) ||
        !(await HospitalDepartmentModel.exists({ _id: departmentId, hospitalUserId: hospitalId(req), active: true })))) {
        return res.status(400).json({ success: false, message: "Department does not belong to this hospital" });
      }
      const association = await HospitalDoctorAssociationModel.findOneAndUpdate(
        { hospitalUserId: hospitalId(req), doctorUserId: doctor._id },
        { $set: { departmentId: departmentId ?? undefined, status: "active" } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      await log(req, "doctor.associated", "doctor-association", association._id, { doctorUserId: doctor._id.toString() });
      return res.status(201).json({ success: true, data: association });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async revokeAssociation(req: Request, res: Response) {
    try {
      const association = await HospitalDoctorAssociationModel.findOneAndUpdate(
        { _id: req.params.associationId, hospitalUserId: hospitalId(req) },
        { $set: { status: "revoked" } },
        { new: true },
      );
      if (!association) return res.status(404).json({ success: false, message: "Association not found" });
      await log(req, "doctor.removed", "doctor-association", association._id);
      return res.json({ success: true, data: association });
    } catch (error) {
      return sendError(res, error);
    }
  }

  async updateAssociation(req: Request, res: Response) {
      try {
        const status = req.body?.status;
        if (!["pending", "active", "revoked"].includes(status)) {
          return res.status(400).json({ success: false, message: "Invalid association status" });
        }
        const association = await HospitalDoctorAssociationModel.findOneAndUpdate(
          { _id: req.params.associationId, hospitalUserId: hospitalId(req) },
          { $set: { status } },
          { new: true },
        );
        if (!association) return res.status(404).json({ success: false, message: "Association not found" });
        await log(req, `doctor.association.${status}`, "doctor-association", association._id);
        return res.json({ success: true, data: association });
      } catch (error) {
        return sendError(res, error);
      }
  }

  async patients(req: Request, res: Response) {
      try {
        const hospital = hospitalId(req);
        const appointments = await AppointmentModel.find({ hospitalUserId: hospital })
          .populate("patientUserId", "walletAddress did active")
          .sort({ scheduledAt: -1 })
          .limit(500)
          .lean();
        const patients = new Map<string, { patient: unknown; appointments: number; lastAppointment?: Date }>();
        for (const appointment of appointments) {
          const patient = appointment.patientUserId as unknown as { _id: Types.ObjectId; walletAddress: string; did?: string; active: boolean };
          const key = patient._id.toString();
          const current = patients.get(key);
          patients.set(key, {
            patient,
            appointments: (current?.appointments ?? 0) + 1,
            lastAppointment: current?.lastAppointment ?? appointment.scheduledAt,
          });
        }
        return res.json({ success: true, data: [...patients.values()] });
      } catch (error) {
        return sendError(res, error);
      }
  }

  async stats(req: Request, res: Response) {
      try {
        const hospital = hospitalId(req);
        const [associations, departmentRecords, patients, appointmentRecords, invoices, recentActivities] = await Promise.all([
          HospitalDoctorAssociationModel.find({ hospitalUserId: hospital }).lean(),
          HospitalDepartmentModel.find({ hospitalUserId: hospital, active: true }).select("_id name").lean(),
          AppointmentModel.distinct("patientUserId", { hospitalUserId: hospital }),
          AppointmentModel.find({ hospitalUserId: hospital }).select("doctorUserId scheduledAt status").lean(),
          InvoiceModel.aggregate([
            { $match: { hospitalUserId: hospital } },
            { $group: { _id: "$status", count: { $sum: 1 }, amountMinor: { $sum: "$amountMinor" } } },
          ]),
          HospitalActivityLogModel.find({ hospitalUserId: hospital }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);
        const activeAssociations = associations.filter((item) => item.status === "active");
        const doctorsByDepartment = departmentRecords.map((department) => ({
          name: department.name,
          count: activeAssociations.filter((association) => association.departmentId?.toString() === department._id.toString()).length,
        }));
        const appointmentStatus = ["requested", "confirmed", "completed", "cancelled"].map((status) => ({
          status,
          count: appointmentRecords.filter((appointment) => appointment.status === status).length,
        }));
        const monthCounts = new Map<string, number>();
        for (const appointment of appointmentRecords) {
          const month = new Date(appointment.scheduledAt).toISOString().slice(0, 7);
          monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
        }
        const monthlyAppointments = [...monthCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
        const invoiceStatus = invoices.map((invoice) => ({ status: String(invoice._id), count: invoice.count, amountMinor: invoice.amountMinor }));
        return res.json({
          success: true,
          data: {
            associatedDoctors: associations.filter((item) => item.status === "active").length,
            activeDoctors: associations.filter((item) => item.status === "active").length,
            verifiedDoctors: null,
            associatedPatients: patients.length,
            departments: departmentRecords.length,
            appointments: appointmentRecords.length,
            pendingAssociations: associations.filter((item) => item.status === "pending").length,
            invoices,
            appointmentStatus,
            monthlyAppointments,
            doctorsByDepartment,
            invoiceStatus,
            recentActivities,
          },
        });
      } catch (error) {
        return sendError(res, error);
      }
  }

    async activities(req: Request, res: Response) {
      try {
        const activities = await HospitalActivityLogModel.find({ hospitalUserId: hospitalId(req) })
          .populate("actorUserId", "walletAddress role")
          .sort({ createdAt: -1 })
          .limit(200)
          .lean();
        return res.json({ success: true, data: activities });
      } catch (error) {
        return sendError(res, error);
      }
    }
}
