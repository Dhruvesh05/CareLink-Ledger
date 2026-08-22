import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { deployPatientRegistry } from "./helpers/deploy";
import type { TestAccounts } from "./helpers/accounts";

const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Hospital: 3,
    Admin: 4,
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Sample valid registration payload.
const SAMPLE = {
    fullNameHash: "0x" + "11".repeat(32),
    dobHash: "0x" + "22".repeat(32),
    bloodGroup: "O+",
    gender: "female",
};

describe("PatientRegistry", () => {
    let patientRegistry: any;
    let accessControl: any;
    let accounts: TestAccounts;

    beforeEach(async () => {
        const deployment = await deployPatientRegistry();
        patientRegistry = deployment.patientRegistry;
        accessControl = deployment.accessControl;
        accounts = deployment.accounts;
    });

    async function registerAs(signer: any, overrides: Partial<typeof SAMPLE> = {}) {
        const data = { ...SAMPLE, ...overrides };
        return patientRegistry
            .connect(signer)
            .registerPatient(data.fullNameHash, data.dobHash, data.bloodGroup, data.gender);
    }

    // -----------------------------------------------------------------
    // DEPLOYMENT
    // -----------------------------------------------------------------
    describe("Deployment", () => {
        it("stores the AccessControl address", async () => {
            expect(await patientRegistry.accessControl()).to.equal(
                await accessControl.getAddress()
            );
        });

        it("starts with medicalRecordContract unset (zero address)", async () => {
            expect(await patientRegistry.medicalRecordContract()).to.equal(ZERO_ADDRESS);
        });

        it("starts with totalPatients() == 0", async () => {
            expect(await patientRegistry.totalPatients()).to.equal(0);
        });

        it("reverts on construction with a zero AccessControl address", async () => {
            const { ethers } = await import("hardhat").then((hh) => hh.network.connect());
            const Factory = await ethers.getContractFactory("PatientRegistry");
            await expect(Factory.deploy(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                Factory,
                "ZeroAddress"
            );
        });
    });

    // -----------------------------------------------------------------
    // registerPatient
    // -----------------------------------------------------------------
    describe("registerPatient", () => {
        it("registers a new patient successfully", async () => {
            await registerAs(accounts.patient);
            const patient = await patientRegistry.getPatient(accounts.patient.address);

            expect(patient.wallet).to.equal(accounts.patient.address);
            expect(patient.patientId).to.equal(1);
            expect(patient.fullNameHash).to.equal(SAMPLE.fullNameHash);
            expect(patient.dobHash).to.equal(SAMPLE.dobHash);
            expect(patient.bloodGroup).to.equal(SAMPLE.bloodGroup);
            expect(patient.gender).to.equal(SAMPLE.gender);
            expect(patient.recordCount).to.equal(0);
            expect(patient.active).to.equal(true);
        });

        it("assigns sequential patient IDs across multiple registrations", async () => {
            await registerAs(accounts.patient);
            await registerAs(accounts.doctor); // any distinct EOA works here
            const p1 = await patientRegistry.getPatient(accounts.patient.address);
            const p2 = await patientRegistry.getPatient(accounts.doctor.address);
            expect(p1.patientId).to.equal(1);
            expect(p2.patientId).to.equal(2);
        });

        it("increments totalPatients()", async () => {
            await registerAs(accounts.patient);
            await registerAs(accounts.doctor);
            expect(await patientRegistry.totalPatients()).to.equal(2);
        });

        it("emits PatientRegistered with correct patientId and wallet", async () => {
            await expect(registerAs(accounts.patient))
                .to.emit(patientRegistry, "PatientRegistered")
                .withArgs(1, accounts.patient.address, anyValue);
        });

        it("reverts with PatientAlreadyExists on duplicate registration", async () => {
            await registerAs(accounts.patient);
            await expect(registerAs(accounts.patient)).to.be.revertedWithCustomError(
                patientRegistry,
                "PatientAlreadyExists"
            );
        });

        it("reverts with EmptyField when fullNameHash is empty", async () => {
            await expect(
                registerAs(accounts.patient, { fullNameHash: "" })
            ).to.be.revertedWithCustomError(patientRegistry, "EmptyField");
        });

        it("reverts with EmptyField when dobHash is empty", async () => {
            await expect(
                registerAs(accounts.patient, { dobHash: "" })
            ).to.be.revertedWithCustomError(patientRegistry, "EmptyField");
        });

        it("reverts with EmptyField when bloodGroup is empty", async () => {
            await expect(
                registerAs(accounts.patient, { bloodGroup: "" })
            ).to.be.revertedWithCustomError(patientRegistry, "EmptyField");
        });

        it("reverts with EmptyField when gender is empty", async () => {
            await expect(
                registerAs(accounts.patient, { gender: "" })
            ).to.be.revertedWithCustomError(patientRegistry, "EmptyField");
        });

        it("allows any address (no role requirement) to self-register", async () => {
            await registerAs(accounts.attacker);

            const patient = await patientRegistry.getPatient(accounts.attacker.address);

            expect(patient.wallet).to.equal(accounts.attacker.address);
        });        
});

    // -----------------------------------------------------------------
    // updateBloodGroup
    // -----------------------------------------------------------------
    describe("updateBloodGroup", () => {
        beforeEach(async () => {
            await registerAs(accounts.patient);
        });

        it("updates the caller's own blood group", async () => {
            await patientRegistry.connect(accounts.patient).updateBloodGroup("AB-");
            const patient = await patientRegistry.getPatient(accounts.patient.address);
            expect(patient.bloodGroup).to.equal("AB-");
        });

        it("emits BloodGroupUpdated", async () => {
            await expect(
                patientRegistry.connect(accounts.patient).updateBloodGroup("AB-")
            )
                .to.emit(patientRegistry, "BloodGroupUpdated")
                .withArgs(accounts.patient.address, "AB-", anyValue);
        });

        it("reverts with PatientNotFound for an unregistered caller", async () => {
            await expect(
                patientRegistry.connect(accounts.attacker).updateBloodGroup("AB-")
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });

        it("reverts with EmptyField when new blood group is empty", async () => {
            await expect(
                patientRegistry.connect(accounts.patient).updateBloodGroup("")
            ).to.be.revertedWithCustomError(patientRegistry, "EmptyField");
        });

        it("reverts with PatientInactive after the patient deactivates themselves", async () => {
            await patientRegistry.connect(accounts.patient).deactivatePatient();
            await expect(
                patientRegistry.connect(accounts.patient).updateBloodGroup("AB-")
            ).to.be.revertedWithCustomError(patientRegistry, "PatientInactive");
        });
    });

    // -----------------------------------------------------------------
    // deactivatePatient
    // -----------------------------------------------------------------
    describe("deactivatePatient", () => {
        beforeEach(async () => {
            await registerAs(accounts.patient);
        });

        it("deactivates the caller's own profile", async () => {
            await patientRegistry.connect(accounts.patient).deactivatePatient();
            const patient = await patientRegistry.getPatient(accounts.patient.address);
            expect(patient.active).to.equal(false);
        });

        it("emits PatientDeactivated", async () => {
            await expect(patientRegistry.connect(accounts.patient).deactivatePatient())
                .to.emit(patientRegistry, "PatientDeactivated")
                .withArgs(accounts.patient.address, anyValue);
        });

        it("reverts with PatientNotFound for an unregistered caller", async () => {
            await expect(
                patientRegistry.connect(accounts.attacker).deactivatePatient()
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });

        it("reverts with PatientInactive when already deactivated", async () => {
            await patientRegistry.connect(accounts.patient).deactivatePatient();
            await expect(
                patientRegistry.connect(accounts.patient).deactivatePatient()
            ).to.be.revertedWithCustomError(patientRegistry, "PatientInactive");
        });

        it("cannot be called by anyone other than the patient themselves (no admin override)", async () => {
            // Design note: deactivatePatient() has no admin path — only the
            // registered wallet itself can deactivate. Admin has no bypass here
            // (unlike reactivatePatient, which IS admin-only). Confirms that
            // asymmetry is intentional rather than a missing modifier.
            await expect(
                patientRegistry.connect(accounts.owner).deactivatePatient()
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });
    });

    // -----------------------------------------------------------------
    // reactivatePatient (admin only)
    // -----------------------------------------------------------------
    describe("reactivatePatient", () => {
        beforeEach(async () => {
            await registerAs(accounts.patient);
            await patientRegistry.connect(accounts.patient).deactivatePatient();
        });

        it("allows admin to reactivate a deactivated patient", async () => {
            await patientRegistry.reactivatePatient(accounts.patient.address);
            const patient = await patientRegistry.getPatient(accounts.patient.address);
            expect(patient.active).to.equal(true);
        });

        it("emits PatientReactivated", async () => {
            await expect(patientRegistry.reactivatePatient(accounts.patient.address))
                .to.emit(patientRegistry, "PatientReactivated")
                .withArgs(accounts.patient.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                patientRegistry.connect(accounts.attacker).reactivatePatient(accounts.patient.address)
            ).to.be.revertedWithCustomError(patientRegistry, "Unauthorized");
        });

        it("reverts with PatientNotFound for an unregistered wallet", async () => {
            await expect(
                patientRegistry.reactivatePatient(accounts.other.address)
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });

        it("reverts with PatientAlreadyActive when patient is already active", async () => {
            await patientRegistry.reactivatePatient(accounts.patient.address);
            await expect(
                patientRegistry.reactivatePatient(accounts.patient.address)
            ).to.be.revertedWithCustomError(patientRegistry, "PatientAlreadyActive");
        });

        it("respects AccessControl's admin set (a newly promoted admin can also reactivate)", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin);
            await patientRegistry
                .connect(accounts.admin)
                .reactivatePatient(accounts.patient.address);

            const patient = await patientRegistry.getPatient(accounts.patient.address);

            expect(patient.active).to.equal(true);
        });
    });

    // -----------------------------------------------------------------
    // setMedicalRecordContract (admin only)
    // -----------------------------------------------------------------
    describe("setMedicalRecordContract", () => {
        it("allows admin to set the MedicalRecord contract address", async () => {
            await patientRegistry.setMedicalRecordContract(accounts.other.address);
            expect(await patientRegistry.medicalRecordContract()).to.equal(accounts.other.address);
        });

        it("emits MedicalRecordContractUpdated with previous and current addresses", async () => {
            await expect(patientRegistry.setMedicalRecordContract(accounts.other.address))
                .to.emit(patientRegistry, "MedicalRecordContractUpdated")
                .withArgs(ZERO_ADDRESS, accounts.other.address);
        });

        it("allows rotating to a new MedicalRecord address later", async () => {
            await patientRegistry.setMedicalRecordContract(accounts.other.address);
            await expect(patientRegistry.setMedicalRecordContract(accounts.attacker.address))
                .to.emit(patientRegistry, "MedicalRecordContractUpdated")
                .withArgs(accounts.other.address, accounts.attacker.address);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                patientRegistry.connect(accounts.attacker).setMedicalRecordContract(accounts.other.address)
            ).to.be.revertedWithCustomError(patientRegistry, "Unauthorized");
        });

        it("reverts with ZeroAddress when setting to address(0)", async () => {
            await expect(
                patientRegistry.setMedicalRecordContract(ZERO_ADDRESS)
            ).to.be.revertedWithCustomError(patientRegistry, "ZeroAddress");
        });
    });

    // -----------------------------------------------------------------
    // incrementRecordCount (onlyMedicalRecord)
    // -----------------------------------------------------------------
    describe("incrementRecordCount", () => {
        beforeEach(async () => {
            await registerAs(accounts.patient);
        });

        it("reverts with MedicalRecordContractNotSet before any address is configured", async () => {
            await expect(
                patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address)
            ).to.be.revertedWithCustomError(patientRegistry, "MedicalRecordContractNotSet");
        });

        describe("once medicalRecordContract is set to accounts.other", () => {
            beforeEach(async () => {
                await patientRegistry.setMedicalRecordContract(accounts.other.address);
            });

            it("allows the configured MedicalRecord address to increment", async () => {
                await patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address);
                expect(await patientRegistry.getRecordCount(accounts.patient.address)).to.equal(1);
            });

            it("increments across multiple calls", async () => {
                await patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address);
                await patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address);
                expect(await patientRegistry.getRecordCount(accounts.patient.address)).to.equal(2);
            });

            it("emits RecordCountIncremented with the running total", async () => {
                await expect(
                    patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address)
                )
                    .to.emit(patientRegistry, "RecordCountIncremented")
                    .withArgs(accounts.patient.address, 1);
            });

            it("reverts with Unauthorized when called by any other address (including admin)", async () => {
                await expect(
                    patientRegistry.incrementRecordCount(accounts.patient.address)
                ).to.be.revertedWithCustomError(patientRegistry, "Unauthorized");

                await expect(
                    patientRegistry.connect(accounts.attacker).incrementRecordCount(accounts.patient.address)
                ).to.be.revertedWithCustomError(patientRegistry, "Unauthorized");
            });

            it("reverts with PatientNotFound for an unregistered patient", async () => {
                await expect(
                    patientRegistry.connect(accounts.other).incrementRecordCount(accounts.attacker.address)
                ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
            });

            it("reverts with PatientInactive for a deactivated patient", async () => {
                await patientRegistry.connect(accounts.patient).deactivatePatient();
                await expect(
                    patientRegistry.connect(accounts.other).incrementRecordCount(accounts.patient.address)
                ).to.be.revertedWithCustomError(patientRegistry, "PatientInactive");
            });
        });
    });

    // -----------------------------------------------------------------
    // VIEW FUNCTIONS
    // -----------------------------------------------------------------
    describe("View functions", () => {
        it("getPatient reverts with PatientNotFound for an unregistered wallet", async () => {
            await expect(
                patientRegistry.getPatient(accounts.attacker.address)
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });

        it("getRecordCount reverts with PatientNotFound for an unregistered wallet", async () => {
            await expect(
                patientRegistry.getRecordCount(accounts.attacker.address)
            ).to.be.revertedWithCustomError(patientRegistry, "PatientNotFound");
        });

        it("isPatientActive returns false (no revert) for an unregistered wallet", async () => {
            // Design note: unlike getPatient/getRecordCount, isPatientActive has
            // no patientRegistered modifier — it's a plain mapping lookup that
            // defaults to false rather than reverting. Locks in that asymmetry.
            expect(await patientRegistry.isPatientActive(accounts.attacker.address)).to.equal(false);
        });

        it("isPatientActive returns true for an active registered patient", async () => {
            await registerAs(accounts.patient);
            expect(await patientRegistry.isPatientActive(accounts.patient.address)).to.equal(true);
        });

        it("isPatientActive returns false after deactivation", async () => {
            await registerAs(accounts.patient);
            await patientRegistry.connect(accounts.patient).deactivatePatient();
            expect(await patientRegistry.isPatientActive(accounts.patient.address)).to.equal(false);
        });
    });

    // -----------------------------------------------------------------
    // EDGE CASES
    // -----------------------------------------------------------------
    describe("Edge cases", () => {
        it("a re-registration attempt after deactivation still reverts (wallet slot is reused, not cleared)", async () => {
            // Design note: deactivatePatient only flips `active`; the Patient
            // struct's `wallet` field stays non-zero, so registerPatient's
            // `_patients[msg.sender].wallet != address(0)` check still blocks
            // re-registration. There is no "re-register" path — only
            // admin reactivation. This test documents that intentional design.
            await registerAs(accounts.patient);
            await patientRegistry.connect(accounts.patient).deactivatePatient();
            await expect(registerAs(accounts.patient)).to.be.revertedWithCustomError(
                patientRegistry,
                "PatientAlreadyExists"
            );
        });

        it("registering two different wallets does not collide", async () => {
            await registerAs(accounts.patient);
            await registerAs(accounts.attacker, { bloodGroup: "A-" });

            const p1 = await patientRegistry.getPatient(accounts.patient.address);
            const p2 = await patientRegistry.getPatient(accounts.attacker.address);

            expect(p1.bloodGroup).to.equal(SAMPLE.bloodGroup);
            expect(p2.bloodGroup).to.equal("A-");
        });
    });
});