import { ethers } from "ethers";
import { polygon } from "../src/blockchain/polygon/config/polygon";
import MedicalRecordABI from "../src/blockchain/polygon/abi/MedicalRecord.json";

async function main() {
    const wallet = await polygon.wallet.getAddress();

    console.log("===== WALLET =====");
    console.log(wallet);

    console.log("\n===== ACCESS CONTROL =====");

    const isDoctor =
        await polygon.accessControl.isDoctor(wallet);

    const isAdmin =
        await polygon.accessControl.isAdmin(wallet);

    console.log("AccessControl.isDoctor:", isDoctor);
    console.log("AccessControl.isAdmin:", isAdmin);

    console.log("\n===== DOCTOR REGISTRY =====");

    const doctor =
        await polygon.doctorRegistry.getDoctor(wallet);

    console.log("Doctor:", doctor);

    console.log(
        "Doctor active:",
        await polygon.doctorRegistry.isDoctorActive(wallet)
    );

    console.log(
        "Doctor verified:",
        await polygon.doctorRegistry.isDoctorVerified(wallet)
    );

    console.log(
        "Doctor hospital:",
        await polygon.doctorRegistry.getDoctorHospital(wallet)
    );

    console.log("\n===== PATIENT REGISTRY =====");

    console.log(
        "Patient active:",
        await polygon.patientRegistry.isPatientActive(wallet)
    );

    const patient =
        await polygon.patientRegistry.getPatient(wallet);

    console.log("Patient:", patient);

    console.log("\n===== HOSPITAL =====");

    const hospital =
        await polygon.doctorRegistry.getDoctorHospital(wallet);

    console.log("Hospital:", hospital);

    console.log(
        "Hospital active:",
        await polygon.hospitalRegistry.isHospitalActive(hospital)
    );

    console.log(
        "Hospital verified:",
        await polygon.hospitalRegistry.isHospitalVerified(hospital)
    );

    console.log("\n===== MEDICAL RECORD DEPENDENCIES =====");

    console.log(
        "MedicalRecord:",
        await polygon.medicalRecord.getAddress()
    );

    console.log(
        "PatientRegistry:",
        await polygon.patientRegistry.getAddress()
    );

    console.log(
        "DoctorRegistry:",
        await polygon.doctorRegistry.getAddress()
    );

    console.log(
        "HospitalRegistry:",
        await polygon.hospitalRegistry.getAddress()
    );

    console.log(
        "AuditLog:",
        await polygon.auditLog.getAddress()
    );

    console.log("\n===== MEDICAL RECORD ERROR DECODING =====");

    const iface = new ethers.Interface(MedicalRecordABI.abi);

    const selector = "0x82b42900";

    try {
        const parsed = iface.parseError(selector);

        console.log("Selector:", selector);
        console.log("Decoded error:", parsed);
    } catch (error) {
        console.log("Could not decode selector from MedicalRecord ABI.");
        console.log("Selector:", selector);
    }
}

main().catch((error) => {
    console.error("\nDIAGNOSTIC FAILED");
    console.error(error);
    process.exit(1);
});
