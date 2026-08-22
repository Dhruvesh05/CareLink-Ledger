import { expect } from "chai";
import { network } from "hardhat";
import { deployCareLink } from "./helpers/deploy";

describe("CareLink Security", function () {
  async function setup() {
    return await deployCareLink();
  }

  describe("AccessControl", function () {
    it("prevents a non-admin from assigning roles", async function () {
      const { accessControl, accounts } = await setup();

      const Role = {
        None: 0,
        Patient: 1,
        Doctor: 2,
        Hospital: 3,
        Admin: 4,
      };

      await expect(
        accessControl
          .connect(accounts.attacker)
          .assignRole(accounts.other.address, Role.Patient)
      ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
    });

    it("prevents a non-admin from changing roles", async function () {
      const { accessControl, accounts } = await setup();

      const Role = {
        None: 0,
        Patient: 1,
        Doctor: 2,
        Hospital: 3,
        Admin: 4,
      };

      await accessControl.assignRole(
        accounts.patient.address,
        Role.Patient
      );

      await expect(
        accessControl
          .connect(accounts.attacker)
          .updateRole(accounts.patient.address, Role.Doctor)
      ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
    });

    it("prevents a non-admin from revoking roles", async function () {
      const { accessControl, accounts } = await setup();

      const Role = {
        None: 0,
        Patient: 1,
        Doctor: 2,
        Hospital: 3,
        Admin: 4,
      };

      await accessControl.assignRole(
        accounts.patient.address,
        Role.Patient
      );

      await expect(
        accessControl
          .connect(accounts.attacker)
          .revokeRole(accounts.patient.address)
      ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
    });
  });

  describe("Doctor verification", function () {
    it("prevents a non-admin from verifying a doctor", async function () {
      const { doctorRegistry, accounts } = await setup();

      await doctorRegistry.registerDoctor(
        "doctor-name",
        "license",
        "cardiology",
        accounts.hospital.address
      );

      await expect(
        doctorRegistry
          .connect(accounts.attacker)
          .verifyDoctor(accounts.doctor.address)
      ).to.be.revertedWithCustomError(doctorRegistry, "Unauthorized");
    });
  });

  describe("Hospital verification", function () {
    it("prevents a non-admin from verifying a hospital", async function () {
      const { hospitalRegistry, accounts } = await setup();

      await hospitalRegistry.registerHospital(
        "hospital",
        "registration",
        "location"
      );

      await expect(
        hospitalRegistry
          .connect(accounts.attacker)
          .verifyHospital(accounts.hospital.address)
      ).to.be.revertedWithCustomError(hospitalRegistry, "Unauthorized");
    });
  });

  describe("MedicalRecord access", function () {
    it("prevents an unrelated account from reading a record", async function () {
      const {
        accessControl,
        doctorRegistry,
        hospitalRegistry,
        patientRegistry,
        medicalRecord,
        accounts,
      } = await setup();

      const Role = {
        None: 0,
        Patient: 1,
        Doctor: 2,
        Hospital: 3,
        Admin: 4,
      };

      // Register patient
      await patientRegistry
        .connect(accounts.patient)
        .registerPatient(
          "patient-name",
          "dob",
          "O+",
          "male"
        );

      // Register hospital
      await hospitalRegistry
        .connect(accounts.hospital)
        .registerHospital(
          "hospital",
          "registration",
          "location"
        );

      // Admin verifies hospital
      await hospitalRegistry
        .connect(accounts.owner)
        .verifyHospital(accounts.hospital.address);

      // Admin assigns Doctor role
      await accessControl
        .connect(accounts.owner)
        .assignRole(
          accounts.doctor.address,
          Role.Doctor
        );

      // Doctor registers
      await doctorRegistry
        .connect(accounts.doctor)
        .registerDoctor(
          "doctor-name",
          "license",
          "cardiology",
          accounts.hospital.address
        );

      // Admin verifies doctor
      await doctorRegistry
        .connect(accounts.owner)
        .verifyDoctor(accounts.doctor.address);

      // Create the medical record
      await medicalRecord
        .connect(accounts.doctor)
        .createMedicalRecord(
          accounts.patient.address,
          "QmTestIPFSHash",
          "file-hash",
          "general",
          false
        );

      // Unrelated attacker must not be able to read it
      await expect(
        medicalRecord
          .connect(accounts.attacker)
          .getMedicalRecord(1)
      ).to.be.revertedWithCustomError(
        medicalRecord,
        "Unauthorized"
      );
    });
  });

  describe("AuditLog", function () {
    it("prevents unauthorized accounts from creating audits", async function () {
      const { auditLog, accounts } = await setup();

      await expect(
        auditLog
          .connect(accounts.attacker)
          .createAudit(
            1,
            accounts.attacker.address,
            0,
            "unauthorized"
          )
      ).to.be.revertedWithCustomError(
        auditLog,
        "Unauthorized"
      );
    });
  });
});
