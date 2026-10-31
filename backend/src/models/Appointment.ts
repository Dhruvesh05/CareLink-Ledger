import mongoose, { Document, Schema, Types } from "mongoose";

export type AppointmentStatus = "requested" | "confirmed" | "cancelled" | "completed";

export interface IAppointmentStatusHistory {
  status: AppointmentStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
}

export interface IAppointment extends Document {
  patientUserId: Types.ObjectId;
  doctorUserId: Types.ObjectId;
  hospitalUserId?: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  statusHistory: IAppointmentStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hospitalUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, min: 15, max: 240, default: 30 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["requested", "confirmed", "cancelled", "completed"], default: "requested", index: true },
    statusHistory: { type: [{
      status: { type: String, enum: ["requested", "confirmed", "cancelled", "completed"], required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      changedAt: { type: Date, required: true },
    }], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
