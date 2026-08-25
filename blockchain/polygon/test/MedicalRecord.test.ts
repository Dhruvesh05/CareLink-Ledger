// test/MedicalRecord.test.ts
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const Role = {
  None: 0,
  Patient: 1,
  Doctor: 2,
  Hospital: 3,
  Admin: 4,
} as const;

const Action = {
  CREATE_RECORD: 0,
  UPDATE_RECORD: 1,
  VIEW_RECORD: 2,
  DOWNLOAD_RECORD: 3,
  GRANT_ACCESS: 4,
  REVOKE_ACCESS: 5,
  DEACTIVATE_RECORD: 6,
} as const;

function anyTimestamp() {
  return (value: unknown) => typeof value === "bigint";
}

describe("MedicalRecord", function () {
  /**
   * Deploys the full CareLink Ledger stack and wires it exactly the way
   * scripts/deploy.ts does, then registers and verifies one patient, one
   * hospital, and one doctor affiliated with that hospital — the minimum
   * "everything is valid" baseline that most tests build on.
   */
  async function deployFullStackFixture() {
    const [
      admin,
      patient,
      patient2,
      doctor,
      doctor2,
      hospital,
      hospital2,
      stranger,
    ] = await ethers.getSigners();

    const accessControl = await ethers.deployContract("AccessControl");
    const patientRegistry = await ethers.deployContract("PatientRegistry", [
      await accessControl.getAddress(),
    ]);
    const doctorRegistry = await ethers.deployContract("DoctorRegistry", [
      await accessControl.getAddress(),
    ]);
    const hospitalRegistry = await ethers.deployContract("HospitalRegistry", [
      await accessControl.getAddress(),
    ]);
    const auditLog = await ethers.deployContract("AuditLog", [await accessControl.getAddress()]);

    const medicalRecord = await ethers.deployContract("MedicalRecord", [
      await patientRegistry.getAddress(),
      await doctorRegistry.getAddress(),
      await hospitalRegistry.getAddress(),
      await accessControl.getAddress(),
      await auditLog.getAddress(),
    ]);

    await patientRegistry.connect(admin).setMedicalRecordContract(await medicalRecord.getAddress());
    await auditLog.connect(admin).setMedicalRecordContract(await medicalRecord.getAddress());

    // Baseline patient.
    await patientRegistry.connect(patient).registerPatient("pName1", "pDob1", "O+", "male");

    // Baseline hospital, verified.
    await hospitalRegistry.connect(hospital).registerHospital("hName1", "hReg1", "hLoc1");
    await hospitalRegistry.connect(admin).verifyHospital(hospital.address);

    // Baseline doctor: AccessControl role + registry entry + verification.
    await accessControl.connect(admin).assignRole(doctor.address, Role.Doctor);
    await doctorRegistry
      .connect(doctor)
      .registerDoctor("dName1", "dLicense1", "Cardiology", hospital.address);
    await doctorRegistry.connect(admin).verifyDoctor(doctor.address);

    return {
      accessControl,
      patientRegistry,
      doctorRegistry,
      hospitalRegistry,
      auditLog,
      medicalRecord,
      admin,
      patient,
      patient2,
      doctor,
      doctor2,
      hospital,
      hospital2,
      stranger,
    };
  }

  async function withOneRecordFixture() {
    const ctx = await deployFullStackFixture();
    const tx = await ctx.medicalRecord
      .connect(ctx.doctor)
      .createMedicalRecord(ctx.patient.address, "ipfsHash1", "fileHash1", "Blood Test", false);
    await tx.wait();
    return { ...ctx, recordId: 1n };
  }

  // -------------------------------------------------------------------------
  // Deployment
  // -------------------------------------------------------------------------
  describe("Deployment", function () {
    async function dependencyAddressesFixture() {
      const { accessControl, patientRegistry, doctorRegistry, hospitalRegistry, auditLog } =
        await deployFullStackFixture();
      return {
        pr: await patientRegistry.getAddress(),
        dr: await doctorRegistry.getAddress(),
        hr: await hospitalRegistry.getAddress(),
        ac: await accessControl.getAddress(),
        al: await auditLog.getAddress(),
      };
    }

    it("reverts with ZeroAddress if patientRegistryAddress is the zero address", async function () {
      const { dr, hr, ac, al } = await dependencyAddressesFixture();
      const Factory = await ethers.getContractFactory("MedicalRecord");
      await expect(
        Factory.deploy(ethers.ZeroAddress, dr, hr, ac, al)
      ).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("reverts with ZeroAddress if doctorRegistryAddress is the zero address", async function () {
      const { pr, hr, ac, al } = await dependencyAddressesFixture();
      const Factory = await ethers.getContractFactory("MedicalRecord");
      await expect(
        Factory.deploy(pr, ethers.ZeroAddress, hr, ac, al)
      ).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("reverts with ZeroAddress if hospitalRegistryAddress is the zero address", async function () {
      const { pr, dr, ac, al } = await dependencyAddressesFixture();
      const Factory = await ethers.getContractFactory("MedicalRecord");
      await expect(
        Factory.deploy(pr, dr, ethers.ZeroAddress, ac, al)
      ).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("reverts with ZeroAddress if accessControlAddress is the zero address", async function () {
      const { pr, dr, hr, al } = await dependencyAddressesFixture();
      const Factory = await ethers.getContractFactory("MedicalRecord");
      await expect(
        Factory.deploy(pr, dr, hr, ethers.ZeroAddress, al)
      ).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("reverts with ZeroAddress if auditLogAddress is the zero address", async function () {
      const { pr, dr, hr, ac } = await dependencyAddressesFixture();
      const Factory = await ethers.getContractFactory("MedicalRecord");
      await expect(
        Factory.deploy(pr, dr, hr, ac, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Factory, "ZeroAddress");
    });

    it("stores the exact PatientRegistry address passed to the constructor", async function () {
      const { medicalRecord, patientRegistry } = await deployFullStackFixture();
      expect(await medicalRecord.patientRegistry()).to.equal(await patientRegistry.getAddress());
    });

    it("stores the exact DoctorRegistry address passed to the constructor", async function () {
      const { medicalRecord, doctorRegistry } = await deployFullStackFixture();
      expect(await medicalRecord.doctorRegistry()).to.equal(await doctorRegistry.getAddress());
    });

    it("stores the exact HospitalRegistry address passed to the constructor", async function () {
      const { medicalRecord, hospitalRegistry } = await deployFullStackFixture();
      expect(await medicalRecord.hospitalRegistry()).to.equal(await hospitalRegistry.getAddress());
    });

    it("stores the exact AccessControl address passed to the constructor", async function () {
      const { medicalRecord, accessControl } = await deployFullStackFixture();
      expect(await medicalRecord.accessControl()).to.equal(await accessControl.getAddress());
    });

    it("stores the exact AuditLog address passed to the constructor", async function () {
      const { medicalRecord, auditLog } = await deployFullStackFixture();
      expect(await medicalRecord.auditLog()).to.equal(await auditLog.getAddress());
    });

    it("starts with zero records", async function () {
      const { medicalRecord } = await deployFullStackFixture();
      expect(await medicalRecord.totalRecords()).to.equal(0n);
      expect(await medicalRecord.recordExists(1n)).to.equal(false);
    });

    it("reverts every write function before AuditLog has been wired to this contract's address", async function () {
      // Deploys MedicalRecord against a fresh AuditLog that has NOT yet had
      // setMedicalRecordContract called with this MedicalRecord's address —
      // exactly the failure mode the constructor's NatSpec warns about.
      const [admin, doctor, patient, hospital] = await ethers.getSigners();

      const accessControl = await ethers.deployContract("AccessControl");
      const patientRegistry = await ethers.deployContract("PatientRegistry", [
        await accessControl.getAddress(),
      ]);
      const doctorRegistry = await ethers.deployContract("DoctorRegistry", [
        await accessControl.getAddress(),
      ]);
      const hospitalRegistry = await ethers.deployContract("HospitalRegistry", [
        await accessControl.getAddress(),
      ]);
      const auditLog = await ethers.deployContract("AuditLog", [await accessControl.getAddress()]);

      const medicalRecord = await ethers.deployContract("MedicalRecord", [
        await patientRegistry.getAddress(),
        await doctorRegistry.getAddress(),
        await hospitalRegistry.getAddress(),
        await accessControl.getAddress(),
        await auditLog.getAddress(),
      ]);
      // Deliberately NOT calling auditLog.setMedicalRecordContract(...).

      await patientRegistry.connect(patient).registerPatient("p", "d", "O+", "m");
      await hospitalRegistry.connect(hospital).registerHospital("h", "r", "l");
      await hospitalRegistry.connect(admin).verifyHospital(hospital.address);
      await accessControl.connect(admin).assignRole(doctor.address, Role.Doctor);
      await doctorRegistry.connect(doctor).registerDoctor("d", "l", "Cardiology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor.address);

      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(auditLog, "MedicalRecordContractNotSet");
    });
  });

  // -------------------------------------------------------------------------
  // createMedicalRecord
  // -------------------------------------------------------------------------
  describe("createMedicalRecord", function () {
    it("creates a record with the expected fields and version 1", async function () {
      const { medicalRecord, doctor, patient, hospital } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfsHash1", "fileHash1", "Blood Test", false);

      const record = await medicalRecord.connect(patient).getMedicalRecord(1n);
      expect(record.recordId).to.equal(1n);
      expect(record.patient).to.equal(patient.address);
      expect(record.doctor).to.equal(doctor.address);
      expect(record.hospital).to.equal(hospital.address);
      expect(record.ipfsHash).to.equal("ipfsHash1");
      expect(record.fileHash).to.equal("fileHash1");
      expect(record.category).to.equal("Blood Test");
      expect(record.version).to.equal(1n);
      expect(record.active).to.equal(true);
      expect(record.emergency).to.equal(false);
    });

    it("returns the new recordId from the call itself", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      const returnedId = await medicalRecord
        .connect(doctor)
        .createMedicalRecord.staticCall(patient.address, "ipfs", "file", "Blood Test", false);
      expect(returnedId).to.equal(1n);

      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false);
      expect(await medicalRecord.totalRecords()).to.equal(1n);
    });

    it("derives the hospital from DoctorRegistry rather than trusting caller input", async function () {
      // There is no hospital parameter on createMedicalRecord at all — this
      // test simply documents/confirms that the stored hospital always
      // matches what DoctorRegistry reports for the calling doctor.
      const { medicalRecord, doctorRegistry, doctor, patient } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Diagnosis", false);
      const record = await medicalRecord.connect(patient).getMedicalRecord(1n);
      expect(record.hospital).to.equal(await doctorRegistry.getDoctorHospital(doctor.address));
    });

    it("emits RecordCreated", async function () {
      const { medicalRecord, doctor, patient, hospital } = await deployFullStackFixture();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      )
        .to.emit(medicalRecord, "RecordCreated")
        .withArgs(1n, patient.address, doctor.address, hospital.address, "Blood Test", anyTimestamp());
    });

    it("emits EmergencyRecordCreated only when emergency is true", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();

      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs1", "file1", "ECG", true)
      )
        .to.emit(medicalRecord, "EmergencyRecordCreated")
        .withArgs(1n, patient.address, doctor.address, anyTimestamp());

      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs2", "file2", "ECG", false)
      ).to.not.emit(medicalRecord, "EmergencyRecordCreated");
    });

    it("increments the patient's record count via PatientRegistry", async function () {
      const { medicalRecord, patientRegistry, doctor, patient } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false);
      expect(await patientRegistry.getRecordCount(patient.address)).to.equal(1n);
    });

    it("writes a CREATE_RECORD entry to AuditLog with the doctor as performer", async function () {
      const { medicalRecord, auditLog, doctor, patient } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false);

      expect(await auditLog.totalAuditLogs()).to.equal(1n);
      const entry = await auditLog.getAudit(1n);
      expect(entry.recordId).to.equal(1n);
      expect(entry.performedBy).to.equal(doctor.address);
      expect(entry.action).to.equal(Action.CREATE_RECORD);
    });

    it("indexes the new record under the patient, doctor, and hospital", async function () {
      const { medicalRecord, doctor, patient, hospital } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false);

      expect(
        (await medicalRecord.connect(patient).getPatientRecords(patient.address)).map(String)
      ).to.deep.equal(["1"]);
      expect(
        (await medicalRecord.connect(doctor).getDoctorRecords(doctor.address)).map(String)
      ).to.deep.equal(["1"]);
      expect(
        (await medicalRecord.connect(hospital).getHospitalRecords(hospital.address)).map(String)
      ).to.deep.equal(["1"]);
    });

    it("reverts with InvalidPatient for the zero address", async function () {
      const { medicalRecord, doctor } = await deployFullStackFixture();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(ethers.ZeroAddress, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "InvalidPatient");
    });

    it("reverts with PatientInactive for an unregistered patient address", async function () {
      const { medicalRecord, doctor, stranger } = await deployFullStackFixture();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(stranger.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "PatientInactive");
    });

    it("reverts with PatientInactive for a deactivated patient", async function () {
      const { medicalRecord, patientRegistry, doctor, patient } = await deployFullStackFixture();
      await patientRegistry.connect(patient).deactivatePatient();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "PatientInactive");
    });

    it("reverts with Unauthorized if the caller has no Doctor role in AccessControl", async function () {
      const { medicalRecord, patient, stranger } = await deployFullStackFixture();
      await expect(
        medicalRecord
          .connect(stranger)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with DoctorNotVerified if the doctor role is assigned but DoctorRegistry hasn't verified them", async function () {
      const { medicalRecord, accessControl, doctorRegistry, patient, hospital, doctor2, admin } =
        await deployFullStackFixture();
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      // Deliberately not calling verifyDoctor.

      await expect(
        medicalRecord
          .connect(doctor2)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "DoctorNotVerified");
    });

    it("reverts with DoctorInactive if the verified doctor has since deactivated themselves", async function () {
      const { medicalRecord, doctorRegistry, doctor, patient } = await deployFullStackFixture();
      await doctorRegistry.connect(doctor).deactivateDoctor();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "DoctorInactive");
    });

    it("reverts with HospitalNotVerified if the doctor's affiliated hospital was never verified", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospitalRegistry, patient, doctor2, hospital2, admin } =
        await deployFullStackFixture();

      await hospitalRegistry
        .connect(hospital2)
        .registerHospital("h2", "r2", "l2"); // registered but not verified

      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital2.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);

      await expect(
        medicalRecord
          .connect(doctor2)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "HospitalNotVerified");
    });

    it("reverts with HospitalInactive if the doctor's affiliated hospital has since deactivated", async function () {
      const { medicalRecord, hospitalRegistry, doctor, patient, hospital } =
        await deployFullStackFixture();
      await hospitalRegistry.connect(hospital).deactivateHospital();
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "HospitalInactive");
    });

    it("reverts with EmptyIPFSHash for an empty ipfsHash", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(doctor).createMedicalRecord(patient.address, "", "file", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyIPFSHash");
    });

    it("reverts with EmptyFileHash for an empty fileHash", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(doctor).createMedicalRecord(patient.address, "ipfs", "", "Blood Test", false)
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyFileHash");
    });

    it("reverts with InvalidCategory for an empty category", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(doctor).createMedicalRecord(patient.address, "ipfs", "file", "", false)
      ).to.be.revertedWithCustomError(medicalRecord, "InvalidCategory");
    });

    it("reverts with DuplicateRecord for the same patient + fileHash twice", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs1", "sameFileHash", "Blood Test", false);
      expect(await medicalRecord.totalRecords()).to.equal(1n);

      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient.address, "ipfs2", "sameFileHash", "X-Ray", false)
      ).to.be.revertedWithCustomError(medicalRecord, "DuplicateRecord");

      // The failed transaction must not have consumed a record ID or
      // otherwise changed the total.
      expect(await medicalRecord.totalRecords()).to.equal(1n);
    });

    it("allows the same fileHash for two different patients", async function () {
      const { medicalRecord, patientRegistry, doctor, patient, patient2 } =
        await deployFullStackFixture();
      await patientRegistry.connect(patient2).registerPatient("p2", "d2", "B+", "female");

      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs1", "sharedFileHash", "Blood Test", false);
      await expect(
        medicalRecord
          .connect(doctor)
          .createMedicalRecord(patient2.address, "ipfs2", "sharedFileHash", "Blood Test", false)
      ).not.to.be.revert(ethers);
    });
  });

  // -------------------------------------------------------------------------
  // updateMedicalRecord
  // -------------------------------------------------------------------------
  describe("updateMedicalRecord", function () {
    it("updates metadata and increments the version", async function () {
      const { medicalRecord, doctor, patient, recordId } = await withOneRecordFixture();
      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfsHash2", "fileHash2", "X-Ray", 1n);

      const record = await medicalRecord.connect(patient).getMedicalRecord(recordId);
      expect(record.ipfsHash).to.equal("ipfsHash2");
      expect(record.fileHash).to.equal("fileHash2");
      expect(record.category).to.equal("X-Ray");
      expect(record.version).to.equal(2n);
    });

    it("never changes patient, doctor, hospital, createdAt, or emergency", async function () {
      const { medicalRecord, doctor, patient, hospital, recordId } = await withOneRecordFixture();
      const before = await medicalRecord.connect(patient).getMedicalRecord(recordId);

      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfsHash2", "fileHash2", "X-Ray", 1n);

      const after = await medicalRecord.connect(patient).getMedicalRecord(recordId);
      expect(after.patient).to.equal(before.patient);
      expect(after.doctor).to.equal(before.doctor);
      expect(after.hospital).to.equal(before.hospital);
      expect(after.createdAt).to.equal(before.createdAt);
      expect(after.emergency).to.equal(before.emergency);
    });

    it("emits RecordUpdated and MetadataUpdated", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      const tx = medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfsHash2", "fileHash2", "X-Ray", 1n);

      await expect(tx).to.emit(medicalRecord, "RecordUpdated").withArgs(recordId, 2n, anyTimestamp());
      await expect(tx)
        .to.emit(medicalRecord, "MetadataUpdated")
        .withArgs(recordId, "ipfsHash2", "fileHash2", "X-Ray");
    });

    it("writes an UPDATE_RECORD entry to AuditLog", async function () {
      const { medicalRecord, auditLog, doctor, recordId } = await withOneRecordFixture();
      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfsHash2", "fileHash2", "X-Ray", 1n);

      expect(await auditLog.totalAuditLogs()).to.equal(2n); // CREATE + UPDATE
      const entry = await auditLog.getAudit(2n);
      expect(entry.action).to.equal(Action.UPDATE_RECORD);
      expect(entry.performedBy).to.equal(doctor.address);
    });

    it("chains correctly across multiple updates: version 1 -> 2 -> 3, and a stale version always reverts", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();

      const initial = await medicalRecord.connect(doctor).getMedicalRecord(recordId);

      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfs2", "file2", "cat2", 1n);
      const afterFirstUpdate = await medicalRecord.connect(doctor).getMedicalRecord(recordId);
      expect(afterFirstUpdate.version).to.equal(2n);
      expect(afterFirstUpdate.createdAt).to.equal(initial.createdAt);
      expect(afterFirstUpdate.updatedAt).to.be.greaterThanOrEqual(initial.updatedAt);
      expect(await medicalRecord.recordExists(recordId)).to.equal(true);

      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfs3", "file3", "cat3", 2n);
      const afterSecondUpdate = await medicalRecord.connect(doctor).getMedicalRecord(recordId);
      expect(afterSecondUpdate.version).to.equal(3n);
      expect(afterSecondUpdate.createdAt).to.equal(initial.createdAt);
      expect(afterSecondUpdate.updatedAt).to.be.greaterThanOrEqual(afterFirstUpdate.updatedAt);

      // Version is now 3; both the original stale value (1) and the
      // previous one (2) must be rejected, not just the very first one.
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "VersionMismatch");
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 2n)
      ).to.be.revertedWithCustomError(medicalRecord, "VersionMismatch");
    });

    it("preserves emergency=true across updates, since it is not one of the mutable fields", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs1", "file1", "ECG", true);

      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(1n, "ipfs2", "file2", "Updated", 1n);

      const record = await medicalRecord.connect(doctor).getMedicalRecord(1n);
      expect(record.emergency).to.equal(true);
      expect(record.category).to.equal("Updated");
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, doctor } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(999n, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });

    it("reverts with InactiveRecord if the record was deactivated", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "InactiveRecord");
    });

    it("reverts with Unauthorized if called by a doctor other than the creator", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospital, doctor2, recordId, admin } =
        await withOneRecordFixture();
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);

      await expect(
        medicalRecord.connect(doctor2).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with VersionMismatch if expectedVersion is stale", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 2n)
      ).to.be.revertedWithCustomError(medicalRecord, "VersionMismatch");
    });

    it("reverts with DoctorInactive if the creating doctor has since deactivated", async function () {
      const { medicalRecord, doctorRegistry, doctor, recordId } = await withOneRecordFixture();
      await doctorRegistry.connect(doctor).deactivateDoctor();
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "DoctorInactive");
    });

    it("reverts with HospitalInactive if the record's hospital has since deactivated", async function () {
      const { medicalRecord, hospitalRegistry, hospital, doctor, recordId } =
        await withOneRecordFixture();
      await hospitalRegistry.connect(hospital).deactivateHospital();
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "HospitalInactive");
    });

    it("reverts with HospitalNotVerified if the record's hospital verification has since been revoked", async function () {
      const { medicalRecord, hospitalRegistry, hospital, doctor, admin, recordId } =
        await withOneRecordFixture();
      await hospitalRegistry.connect(admin).revokeVerification(hospital.address);
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "HospitalNotVerified");
    });

    it("reverts with EmptyIPFSHash / EmptyFileHash / InvalidCategory for empty inputs", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "", "b", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyIPFSHash");
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "", "c", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "EmptyFileHash");
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "a", "b", "", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "InvalidCategory");
    });

    it("reverts with DuplicateRecord if the new fileHash collides with another record for the same patient", async function () {
      const { medicalRecord, doctor, patient, recordId } = await withOneRecordFixture();
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs2", "otherFileHash", "X-Ray", false);

      await expect(
        medicalRecord
          .connect(doctor)
          .updateMedicalRecord(recordId, "ipfs3", "otherFileHash", "Diagnosis", 1n)
      ).to.be.revertedWithCustomError(medicalRecord, "DuplicateRecord");
    });

    it("allows updating a record while keeping its own existing fileHash unchanged", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      // Same fileHash1 the record already owns, only the category changes.
      await expect(
        medicalRecord.connect(doctor).updateMedicalRecord(recordId, "ipfsHash1", "fileHash1", "Updated Category", 1n)
      ).not.to.be.revert(ethers);

      const record = await medicalRecord.connect(doctor).getMedicalRecord(recordId);
      expect(record.category).to.equal("Updated Category");
      expect(record.version).to.equal(2n);
    });
  });

  // -------------------------------------------------------------------------
  // deactivateMedicalRecord
  // -------------------------------------------------------------------------
  describe("deactivateMedicalRecord", function () {
    it("marks the record inactive", async function () {
      const { medicalRecord, doctor, patient, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);
      expect((await medicalRecord.connect(patient).getMedicalRecord(recordId)).active).to.equal(
        false
      );
    });

    it("emits RecordDeactivated", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(doctor).deactivateMedicalRecord(recordId))
        .to.emit(medicalRecord, "RecordDeactivated")
        .withArgs(recordId, doctor.address, anyTimestamp());
    });

    it("writes a DEACTIVATE_RECORD entry to AuditLog", async function () {
      const { medicalRecord, auditLog, doctor, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);
      const entry = await auditLog.getAudit(2n); // CREATE + DEACTIVATE
      expect(entry.action).to.equal(Action.DEACTIVATE_RECORD);
      expect(entry.performedBy).to.equal(doctor.address);
    });

    it("can also be called by an admin, not just the creating doctor", async function () {
      const { medicalRecord, admin, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(admin).deactivateMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("reverts with Unauthorized for anyone else", async function () {
      const { medicalRecord, stranger, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(stranger).deactivateMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, doctor } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(doctor).deactivateMedicalRecord(999n)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });

    it("reverts with AlreadyInactive if called twice", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);
      await expect(
        medicalRecord.connect(doctor).deactivateMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "AlreadyInactive");
    });

    it("does not block reads afterward — deactivation is a soft delete, by design", async function () {
      const { medicalRecord, doctor, patient, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);

      const record = await medicalRecord.connect(patient).getMedicalRecord(recordId);
      expect(record.active).to.equal(false);
      // Every other field is still intact and readable — nothing about the
      // record's history disappears, only its "currently active" flag.
      expect(record.patient).to.equal(patient.address);
      expect(record.ipfsHash).to.equal("ipfsHash1");
    });
  });

  // -------------------------------------------------------------------------
  // Read access: getMedicalRecord / viewRecord
  // -------------------------------------------------------------------------
  describe("getMedicalRecord (free, non-logging read)", function () {
    it("is readable by the owning patient", async function () {
      const { medicalRecord, patient, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(patient).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("is readable by the treating doctor", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(doctor).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("is readable by the originating hospital", async function () {
      const { medicalRecord, hospital, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(hospital).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("is readable by an admin", async function () {
      const { medicalRecord, admin, recordId } = await withOneRecordFixture();
      await expect(medicalRecord.connect(admin).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("reverts with Unauthorized for an unrelated caller", async function () {
      const { medicalRecord, stranger, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(stranger).getMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(patient).getMedicalRecord(999n)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });

    it("never writes to AuditLog, no matter how many times it's called", async function () {
      const { medicalRecord, auditLog, patient, recordId } = await withOneRecordFixture();
      const before = await auditLog.totalAuditLogs();
      await medicalRecord.connect(patient).getMedicalRecord(recordId);
      await medicalRecord.connect(patient).getMedicalRecord(recordId);
      await medicalRecord.connect(patient).getMedicalRecord(recordId);
      expect(await auditLog.totalAuditLogs()).to.equal(before);
    });
  });

  describe("viewRecord (logged read)", function () {
    it("returns the same data as getMedicalRecord", async function () {
      const { medicalRecord, patient, recordId } = await withOneRecordFixture();
      const freeRead = await medicalRecord.connect(patient).getMedicalRecord(recordId);
      const loggedRead = await medicalRecord.connect(patient).viewRecord.staticCall(recordId);
      expect(loggedRead.ipfsHash).to.equal(freeRead.ipfsHash);
      expect(loggedRead.patient).to.equal(freeRead.patient);
    });

    it("writes a VIEW_RECORD entry to AuditLog with the caller as performer", async function () {
      const { medicalRecord, auditLog, hospital, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(hospital).viewRecord(recordId);

      const entry = await auditLog.getAudit(2n); // CREATE + VIEW
      expect(entry.action).to.equal(Action.VIEW_RECORD);
      expect(entry.performedBy).to.equal(hospital.address);
    });

    it("applies the same access rules as getMedicalRecord (reverts with Unauthorized for a stranger)", async function () {
      const { medicalRecord, stranger, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(stranger).viewRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(patient).viewRecord(999n)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });

    it("increments the AuditLog count on every single call, not just the first", async function () {
      const { medicalRecord, auditLog, patient, doctor, hospital, recordId } =
        await withOneRecordFixture();

      await medicalRecord.connect(patient).viewRecord(recordId);
      expect(await auditLog.totalAuditLogs()).to.equal(2n); // CREATE + VIEW

      await medicalRecord.connect(doctor).viewRecord(recordId);
      expect(await auditLog.totalAuditLogs()).to.equal(3n);

      await medicalRecord.connect(hospital).viewRecord(recordId);
      expect(await auditLog.totalAuditLogs()).to.equal(4n);

      const logIds = await auditLog.getRecordAuditLogs(recordId);
      expect(logIds.map(String)).to.deep.equal(["1", "2", "3", "4"]);
    });
  });

  describe("logDownload", function () {
    it("returns the same data as getMedicalRecord", async function () {
      const { medicalRecord, patient, recordId } = await withOneRecordFixture();
      const freeRead = await medicalRecord.connect(patient).getMedicalRecord(recordId);
      const downloadRead = await medicalRecord.connect(patient).logDownload.staticCall(recordId);
      expect(downloadRead.ipfsHash).to.equal(freeRead.ipfsHash);
      expect(downloadRead.patient).to.equal(freeRead.patient);
    });

    it("writes a DOWNLOAD_RECORD entry to AuditLog with the caller as performer", async function () {
      const { medicalRecord, auditLog, hospital, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(hospital).logDownload(recordId);

      const entry = await auditLog.getAudit(2n); // CREATE + DOWNLOAD
      expect(entry.action).to.equal(Action.DOWNLOAD_RECORD);
      expect(entry.performedBy).to.equal(hospital.address);
    });

    it("applies the same access rules as getMedicalRecord (reverts with Unauthorized for a stranger)", async function () {
      const { medicalRecord, stranger, recordId } = await withOneRecordFixture();
      await expect(
        medicalRecord.connect(stranger).logDownload(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("is usable by a patient-granted doctor, not just the treating doctor", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospital, patient, doctor2, admin, recordId } =
        await withOneRecordFixture();
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);

      await expect(medicalRecord.connect(doctor2).logDownload(recordId)).not.to.be.revert(ethers);
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, patient } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(patient).logDownload(999n)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });
  });

  // -------------------------------------------------------------------------
  // grantAccess / revokeAccess
  // -------------------------------------------------------------------------
  describe("grantAccess", function () {
    async function secondVerifiedDoctorFixture() {
      const ctx = await withOneRecordFixture();
      const { accessControl, doctorRegistry, hospital, doctor2, admin } = ctx;
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);
      return ctx;
    }

    it("lets the patient grant a second doctor read access", async function () {
      const { medicalRecord, patient, doctor2, recordId } = await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor2.address)).to.equal(true);
      await expect(medicalRecord.connect(doctor2).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("emits AccessGranted", async function () {
      const { medicalRecord, patient, doctor2, recordId } = await secondVerifiedDoctorFixture();
      await expect(medicalRecord.connect(patient).grantAccess(recordId, doctor2.address))
        .to.emit(medicalRecord, "AccessGranted")
        .withArgs(recordId, patient.address, doctor2.address, anyTimestamp());
    });

    it("writes a GRANT_ACCESS entry to AuditLog with the patient as performer", async function () {
      const { medicalRecord, auditLog, patient, doctor2, recordId } =
        await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      const entry = await auditLog.getAudit(2n); // CREATE + GRANT
      expect(entry.action).to.equal(Action.GRANT_ACCESS);
      expect(entry.performedBy).to.equal(patient.address);
    });

    it("reverts with Unauthorized if called by anyone other than the record's patient", async function () {
      const { medicalRecord, doctor, doctor2, recordId } = await secondVerifiedDoctorFixture();
      await expect(
        medicalRecord.connect(doctor).grantAccess(recordId, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, patient, doctor2 } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(patient).grantAccess(999n, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });

    it("reverts with DoctorNotVerified if the target doctor isn't verified", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospital, patient, doctor2, admin, recordId } =
        await withOneRecordFixture();
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      // Deliberately not verified.

      await expect(
        medicalRecord.connect(patient).grantAccess(recordId, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "DoctorNotVerified");
    });

    it("reverts with AccessAlreadyGranted if granted twice", async function () {
      const { medicalRecord, patient, doctor2, recordId } = await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      await expect(
        medicalRecord.connect(patient).grantAccess(recordId, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "AccessAlreadyGranted");
    });

    it("supports granting access to more than one doctor at once, and both can read", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospital, patient, doctor2, admin, recordId } =
        await secondVerifiedDoctorFixture();

      const [, , , , , , , , doctor3] = await ethers.getSigners();
      await accessControl.connect(admin).assignRole(doctor3.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor3)
        .registerDoctor("d3", "l3", "Oncology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor3.address);

      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      await medicalRecord.connect(patient).grantAccess(recordId, doctor3.address);

      await expect(medicalRecord.connect(doctor2).getMedicalRecord(recordId)).not.to.be.revert(ethers);
      await expect(medicalRecord.connect(doctor3).getMedicalRecord(recordId)).not.to.be.revert(ethers);
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor2.address)).to.equal(true);
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor3.address)).to.equal(true);
    });

    it("stops a granted doctor from reading once they deactivate themselves, without needing an explicit revoke", async function () {
      // This is the scenario a stale-grant bug would fail: the grant boolean
      // alone must not be sufficient once the doctor is no longer active.
      const { medicalRecord, doctorRegistry, patient, doctor2, recordId } =
        await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor2.address)).to.equal(true);

      await doctorRegistry.connect(doctor2).deactivateDoctor();

      await expect(
        medicalRecord.connect(doctor2).getMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
      // The grant record itself is untouched — re-activating the doctor
      // restores access without the patient needing to grant again.
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor2.address)).to.equal(true);
    });

    it("stops a granted doctor from reading once their verification is revoked", async function () {
      const { medicalRecord, doctorRegistry, patient, doctor2, admin, recordId } =
        await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);

      await doctorRegistry.connect(admin).revokeVerification(doctor2.address);

      await expect(
        medicalRecord.connect(doctor2).getMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("restores a granted doctor's access automatically once they are reactivated (no re-grant needed)", async function () {
      const { medicalRecord, doctorRegistry, admin, patient, doctor2, recordId } =
        await secondVerifiedDoctorFixture();
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);

      await doctorRegistry.connect(doctor2).deactivateDoctor();
      await expect(medicalRecord.connect(doctor2).getMedicalRecord(recordId)).to.be.revert(ethers);

      await doctorRegistry.connect(admin).reactivateDoctor(doctor2.address);
      await expect(medicalRecord.connect(doctor2).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });
  });

  describe("revokeAccess", function () {
    async function grantedAccessFixture() {
      const ctx = await withOneRecordFixture();
      const { accessControl, doctorRegistry, hospital, doctor2, admin, patient, medicalRecord, recordId } =
        ctx;
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);
      await medicalRecord.connect(patient).grantAccess(recordId, doctor2.address);
      return ctx;
    }

    it("removes a previously granted doctor's read access", async function () {
      const { medicalRecord, patient, doctor2, recordId } = await grantedAccessFixture();
      await medicalRecord.connect(patient).revokeAccess(recordId, doctor2.address);
      expect(await medicalRecord.isAuthorizedDoctor(recordId, doctor2.address)).to.equal(false);
      await expect(
        medicalRecord.connect(doctor2).getMedicalRecord(recordId)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("emits AccessRevoked", async function () {
      const { medicalRecord, patient, doctor2, recordId } = await grantedAccessFixture();
      await expect(medicalRecord.connect(patient).revokeAccess(recordId, doctor2.address))
        .to.emit(medicalRecord, "AccessRevoked")
        .withArgs(recordId, patient.address, doctor2.address, anyTimestamp());
    });

    it("writes a REVOKE_ACCESS entry to AuditLog with the patient as performer", async function () {
      const { medicalRecord, auditLog, patient, doctor2, recordId } = await grantedAccessFixture();
      await medicalRecord.connect(patient).revokeAccess(recordId, doctor2.address);
      const entry = await auditLog.getAudit(3n); // CREATE + GRANT + REVOKE
      expect(entry.action).to.equal(Action.REVOKE_ACCESS);
      expect(entry.performedBy).to.equal(patient.address);
    });

    it("reverts with Unauthorized if called by anyone other than the record's patient", async function () {
      const { medicalRecord, doctor2, admin, recordId } = await grantedAccessFixture();
      await expect(
        medicalRecord.connect(admin).revokeAccess(recordId, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "Unauthorized");
    });

    it("reverts with AccessNotGranted if the doctor was never granted access", async function () {
      const { medicalRecord, accessControl, doctorRegistry, hospital, patient, doctor2, admin, recordId } =
        await withOneRecordFixture();
      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);
      // Deliberately never calling grantAccess.

      await expect(
        medicalRecord.connect(patient).revokeAccess(recordId, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "AccessNotGranted");
    });

    it("does not affect the treating doctor's own (non-granted) access", async function () {
      const { medicalRecord, patient, doctor, recordId } = await grantedAccessFixture();
      // The treating doctor's access comes from having created the record,
      // not from a grant, so there is nothing to revoke for them.
      await expect(
          medicalRecord
              .connect(patient)
              .revokeAccess(recordId, doctor.address)
      ).to.be.revertedWithCustomError(
          medicalRecord,
          "AccessNotGranted"
      );
      await expect(medicalRecord.connect(doctor).getMedicalRecord(recordId)).not.to.be.revert(ethers);
    });

    it("reverts with RecordNotFound for a nonexistent record", async function () {
      const { medicalRecord, patient, doctor2 } = await deployFullStackFixture();
      await expect(
        medicalRecord.connect(patient).revokeAccess(999n, doctor2.address)
      ).to.be.revertedWithCustomError(medicalRecord, "RecordNotFound");
    });
  });

  // -------------------------------------------------------------------------
  // getPatientRecords / getDoctorRecords / getHospitalRecords
  // -------------------------------------------------------------------------
  describe("Index queries", function () {
    async function twoRecordsFixture() {
      const ctx = await deployFullStackFixture();
      const { medicalRecord, accessControl, doctorRegistry, patient, patient2, patientRegistry, doctor, doctor2, hospital, admin } = ctx;

      await patientRegistry.connect(patient2).registerPatient("p2", "d2", "B+", "female");

      await accessControl.connect(admin).assignRole(doctor2.address, Role.Doctor);
      await doctorRegistry
        .connect(doctor2)
        .registerDoctor("d2", "l2", "Neurology", hospital.address);
      await doctorRegistry.connect(admin).verifyDoctor(doctor2.address);

      // doctor -> patient (record 1), doctor2 -> patient2 (record 2), both at the same hospital.
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs1", "file1", "Blood Test", false);
      await medicalRecord
        .connect(doctor2)
        .createMedicalRecord(patient2.address, "ipfs2", "file2", "X-Ray", false);

      return ctx;
    }

    it("getPatientRecords returns only that patient's records and is callable by the patient or an admin", async function () {
      const { medicalRecord, patient, patient2, admin } = await twoRecordsFixture();
      expect(
        (await medicalRecord.connect(patient).getPatientRecords(patient.address)).map(String)
      ).to.deep.equal(["1"]);
      expect(
        (await medicalRecord.connect(patient2).getPatientRecords(patient2.address)).map(String)
      ).to.deep.equal(["2"]);
      await expect(medicalRecord.connect(admin).getPatientRecords(patient.address)).not.to.be.revert(ethers);
    });

    it("getPatientRecords reverts with Unauthorized for anyone else", async function () {
      const { medicalRecord, patient, stranger } = await twoRecordsFixture();
      await expect(
        medicalRecord.connect(stranger).getPatientRecords(patient.address)
      ).to.be.revert(ethers);
    });

    it("getDoctorRecords returns only that doctor's records and is callable by the doctor or an admin", async function () {
      const { medicalRecord, doctor, doctor2, admin } = await twoRecordsFixture();
      expect(
        (await medicalRecord.connect(doctor).getDoctorRecords(doctor.address)).map(String)
      ).to.deep.equal(["1"]);
      expect(
        (await medicalRecord.connect(doctor2).getDoctorRecords(doctor2.address)).map(String)
      ).to.deep.equal(["2"]);
      await expect(medicalRecord.connect(admin).getDoctorRecords(doctor.address)).not.to.be.revert(ethers);
    });

    it("getDoctorRecords reverts with Unauthorized for anyone else", async function () {
      const { medicalRecord, doctor, stranger } = await twoRecordsFixture();
      await expect(
        medicalRecord.connect(stranger).getDoctorRecords(doctor.address)
      ).to.be.revert(ethers);
    });

    it("getHospitalRecords returns every record originating from that hospital, across doctors", async function () {
      const { medicalRecord, hospital, admin } = await twoRecordsFixture();
      expect(
        (await medicalRecord.connect(hospital).getHospitalRecords(hospital.address)).map(String)
      ).to.deep.equal(["1", "2"]);
      await expect(medicalRecord.connect(admin).getHospitalRecords(hospital.address)).not.to.be.revert(ethers);
    });

    it("getHospitalRecords reverts with Unauthorized for anyone else", async function () {
      const { medicalRecord, hospital, stranger } = await twoRecordsFixture();
      await expect(
        medicalRecord.connect(stranger).getHospitalRecords(hospital.address)
      ).to.be.revert(ethers);
    });
  });

  // -------------------------------------------------------------------------
  // recordExists / totalRecords
  // -------------------------------------------------------------------------
  describe("recordExists / totalRecords", function () {
    it("recordExists is false before creation and true after", async function () {
      const { medicalRecord, doctor, patient } = await deployFullStackFixture();
      expect(await medicalRecord.recordExists(1n)).to.equal(false);
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs", "file", "Blood Test", false);
      expect(await medicalRecord.recordExists(1n)).to.equal(true);
    });

    it("recordExists stays true after deactivation (soft delete, not removal)", async function () {
      const { medicalRecord, doctor, recordId } = await withOneRecordFixture();
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);
      expect(await medicalRecord.recordExists(recordId)).to.equal(true);
    });

    it("totalRecords reflects the number of records created", async function () {
      const { medicalRecord, doctor, patient, patientRegistry, patient2 } =
        await deployFullStackFixture();
      await patientRegistry.connect(patient2).registerPatient("p2", "d2", "B+", "female");

      expect(await medicalRecord.totalRecords()).to.equal(0n);
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient.address, "ipfs1", "file1", "Blood Test", false);
      expect(await medicalRecord.totalRecords()).to.equal(1n);
      await medicalRecord
        .connect(doctor)
        .createMedicalRecord(patient2.address, "ipfs2", "file2", "X-Ray", false);
      expect(await medicalRecord.totalRecords()).to.equal(2n);
    });
  });

  // -------------------------------------------------------------------------
  // Full lifecycle integration
  // -------------------------------------------------------------------------
  describe("Full lifecycle", function () {
    it("produces a chronological CREATE -> UPDATE -> DEACTIVATE audit trail for one record", async function () {
      const { medicalRecord, auditLog, doctor, recordId } = await withOneRecordFixture();

      await medicalRecord
        .connect(doctor)
        .updateMedicalRecord(recordId, "ipfs2", "file2", "Updated", 1n);
      await medicalRecord.connect(doctor).deactivateMedicalRecord(recordId);

      const logIds = await auditLog.getRecordAuditLogs(recordId);
      expect(logIds.map(String)).to.deep.equal(["1", "2", "3"]);

      const actions = await Promise.all(
        logIds.map(async (id: bigint) => (await auditLog.getAudit(id)).action)
      );
      expect(actions.map(Number)).to.deep.equal([
        Action.CREATE_RECORD,
        Action.UPDATE_RECORD,
        Action.DEACTIVATE_RECORD,
      ]);

      const finalRecord = await medicalRecord.connect(doctor).getMedicalRecord(recordId);
      expect(finalRecord.version).to.equal(2n);
      expect(finalRecord.active).to.equal(false);
      expect(finalRecord.category).to.equal("Updated");
    });
  });
});