import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITreatmentNote extends Document {
  doctorUserId: Types.ObjectId;
  patientUserId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentNoteSchema = new Schema<ITreatmentNote>(
  {
    doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    note: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.models.TreatmentNote ||
  mongoose.model<ITreatmentNote>("TreatmentNote", TreatmentNoteSchema);
