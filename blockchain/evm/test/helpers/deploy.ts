import { network } from "hardhat";
import { getTestAccounts } from "./accounts";

export async function deployAccessControl() {
    const { ethers } = await network.create();
    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    return { ethers, accounts, accessControl };
}

/**
 * Component-level deployment for PatientRegistry unit tests.
 * Deploys ONLY AccessControl + PatientRegistry — no MedicalRecord,
 * no DoctorRegistry, etc. `incrementRecordCount` is gated by
 * `onlyMedicalRecord`, so tests exercise that path by pointing
 * `medicalRecordContract` at a plain EOA (accounts.other) and
 * calling from that account — no need to deploy the real contract.
 */
export async function deployPatientRegistry() {
    const { ethers } = await network.create();
    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    const patientRegistry = await ethers.deployContract(
        "PatientRegistry",
        [await accessControl.getAddress()]
    );
    await patientRegistry.waitForDeployment();

    return { ethers, accounts, accessControl, patientRegistry };
}

export async function deployCareLink() {
    // FIX: this was network.create() again in your latest paste —
    // that method does not exist in Hardhat 3. Must be network.connect().
    const { ethers } = await network.create();
    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    const patientRegistry = await ethers.deployContract(
        "PatientRegistry",
        [await accessControl.getAddress()]
    );
    await patientRegistry.waitForDeployment();

    const doctorRegistry = await ethers.deployContract(
        "DoctorRegistry",
        [await accessControl.getAddress()]
    );
    await doctorRegistry.waitForDeployment();

    const hospitalRegistry = await ethers.deployContract(
        "HospitalRegistry",
        [await accessControl.getAddress()]
    );
    await hospitalRegistry.waitForDeployment();

    const auditLog = await ethers.deployContract(
        "AuditLog",
        [await accessControl.getAddress()]
    );
    await auditLog.waitForDeployment();

    const medicalRecord = await ethers.deployContract(
        "MedicalRecord",
        [
            await patientRegistry.getAddress(),
            await doctorRegistry.getAddress(),
            await hospitalRegistry.getAddress(),
            await accessControl.getAddress(),
            await auditLog.getAddress(),
        ]
    );
    await medicalRecord.waitForDeployment();

    await (
        await patientRegistry.setMedicalRecordContract(
            await medicalRecord.getAddress()
        )
    ).wait();

    await (
        await auditLog.setMedicalRecordContract(
            await medicalRecord.getAddress()
        )
    ).wait();

    return {
        ethers,
        accounts,
        accessControl,
        patientRegistry,
        doctorRegistry,
        hospitalRegistry,
        auditLog,
        medicalRecord,
    };
}

export async function deployDoctorRegistry() {
    const { ethers } = await network.create();

    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    const doctorRegistry = await ethers.deployContract(
        "DoctorRegistry",
        [await accessControl.getAddress()]
    );

    await doctorRegistry.waitForDeployment();

    return {
        ethers,
        accounts,
        accessControl,
        doctorRegistry,
    };
}

export async function deployHospitalRegistry() {
    const { ethers } = await network.create();

    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    const hospitalRegistry = await ethers.deployContract(
        "HospitalRegistry",
        [await accessControl.getAddress()]
    );

    await hospitalRegistry.waitForDeployment();

    return {
        ethers,
        accounts,
        accessControl,
        hospitalRegistry,
    };
}

export async function deployAuditLog() {
    const { ethers } = await network.create();

    const accounts = await getTestAccounts(ethers);

    const accessControl = await ethers.deployContract("AccessControl");
    await accessControl.waitForDeployment();

    const auditLog = await ethers.deployContract(
        "AuditLog",
        [await accessControl.getAddress()]
    );
    await auditLog.waitForDeployment();

    return {
        ethers,
        accounts,
        accessControl,
        auditLog,
    };
}