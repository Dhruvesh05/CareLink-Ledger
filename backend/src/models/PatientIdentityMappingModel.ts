import {
    Document,
    Schema,
    model,
    models,
} from "mongoose";

export interface IPatientIdentityMapping extends Document {
    hospitalWallet: string;
    sourcePatientId: string;
    fhirPatientId: string;
    patientWallet: string;
    verifiedByWallet: string;
    verifiedAt: Date;
    active: boolean;
}

const PatientIdentityMappingSchema =
    new Schema<IPatientIdentityMapping>(
        {
            hospitalWallet: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },
            sourcePatientId: {
                type: String,
                required: true,
                trim: true,
            },
            fhirPatientId: {
                type: String,
                required: true,
                trim: true,
            },
            patientWallet: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },
            verifiedByWallet: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },
            verifiedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
            active: {
                type: Boolean,
                required: true,
                default: true,
            },
        },
        {
            versionKey: false,
        },
    );

/**
 * A hospital can have only one mapping for a given
 * source-patient ID and FHIR-patient ID combination.
 */
PatientIdentityMappingSchema.index(
    {
        hospitalWallet: 1,
        sourcePatientId: 1,
        fhirPatientId: 1,
    },
    {
        unique: true,
        name: "unique_hospital_source_fhir_mapping",
    },
);

const PatientIdentityMappingModel =
    models.PatientIdentityMapping ||
    model<IPatientIdentityMapping>(
        "PatientIdentityMapping",
        PatientIdentityMappingSchema,
    );

export default PatientIdentityMappingModel;