import mongoose, { Document, Schema, Types } from "mongoose";

export type AssociationStatus = "pending" | "active" | "revoked";

export interface IHospitalDoctorAssociation extends Document {
  hospitalUserId: Types.ObjectId;
  doctorUserId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  status: AssociationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalDoctorAssociationSchema = new Schema<IHospitalDoctorAssociation>(
  {
    hospitalUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "HospitalDepartment" },
    status: { type: String, enum: ["pending", "active", "revoked"], default: "active", index: true },
  },
  { timestamps: true, versionKey: false },
);

HospitalDoctorAssociationSchema.index({ hospitalUserId: 1, doctorUserId: 1 }, { unique: true });

export default mongoose.models.HospitalDoctorAssociation ||
  mongoose.model<IHospitalDoctorAssociation>("HospitalDoctorAssociation", HospitalDoctorAssociationSchema);
