import mongoose, { Document, Schema } from "mongoose";

export interface IFhirProcessingResult extends Document {
    patientUserId: string;
    recordId: number;
    originalCid: string;
    status: "processing" | "completed" | "failed";
    result?: Record<string, unknown>;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FhirProcessingResultSchema = new Schema<IFhirProcessingResult>(
    {
        patientUserId: { type: String, required: true, index: true, trim: true },
        recordId: { type: Number, required: true, index: true },
        originalCid: { type: String, required: true, trim: true },
        status: {
            type: String,
            required: true,
            enum: ["processing", "completed", "failed"],
            index: true
        },
        result: { type: Schema.Types.Mixed },
        errorMessage: { type: String, trim: true }
    },
    { timestamps: true, versionKey: false }
);

FhirProcessingResultSchema.index(
    { patientUserId: 1, recordId: 1, createdAt: -1 }
);

const FhirProcessingResultModel =
    mongoose.models.FhirProcessingResult ||
    mongoose.model<IFhirProcessingResult>(
        "FhirProcessingResult",
        FhirProcessingResultSchema
    );

export default FhirProcessingResultModel;
