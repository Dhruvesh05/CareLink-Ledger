import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { deployDoctorRegistry } from "./helpers/deploy";
import type { TestAccounts } from "./helpers/accounts";
import { ethers } from "ethers";

const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Hospital: 3,
    Admin: 4,
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SAMPLE = {
    fullNameHash: "0x" + "33".repeat(32),
    licenseNumberHash: "0x" + "44".repeat(32),
    specialization: "Cardiology",
};

describe("DoctorRegistry", () => {
    let doctorRegistry: any;
    let accessControl: any;
    let accounts: TestAccounts;

    beforeEach(async () => {
        const deployment = await deployDoctorRegistry();
        doctorRegistry = deployment.doctorRegistry;
        accessControl = deployment.accessControl;
        accounts = deployment.accounts;
    });

    async function registerAs(
        signer: any,
        hospital: string,
        overrides: Partial<typeof SAMPLE> = {}
    ) {
        const data = { ...SAMPLE, ...overrides };
        return doctorRegistry
            .connect(signer)
            .registerDoctor(data.fullNameHash, data.licenseNumberHash, data.specialization, hospital);
    }

    // -----------------------------------------------------------------
    // 1. DEPLOYMENT
    // -----------------------------------------------------------------
    describe("Deployment", () => {
        it("stores the AccessControl address", async () => {
            expect(await doctorRegistry.accessControl()).to.equal(
                await accessControl.getAddress()
            );
        });

        it("reverts on construction with a zero AccessControl address", async () => {
            const { network } = await import("hardhat");
            const { ethers } = await network.connect();
            const Factory = await ethers.getContractFactory("DoctorRegistry");
            await expect(Factory.deploy(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                Factory,
                "ZeroAddress"
            );
        });

        it("starts with totalDoctors() == 0", async () => {
            expect(await doctorRegistry.totalDoctors()).to.equal(0);
        });

        it("assigns the first registered doctor id == 1", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.doctorId).to.equal(1);
        });
    });

    // -----------------------------------------------------------------
    // 2. registerDoctor
    // -----------------------------------------------------------------
    describe("registerDoctor", () => {
        it("registers a new doctor successfully", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);

            expect(doctor.wallet).to.equal(accounts.doctor.address);
            expect(doctor.fullNameHash).to.equal(SAMPLE.fullNameHash);
            expect(doctor.licenseNumberHash).to.equal(SAMPLE.licenseNumberHash);
            expect(doctor.specialization).to.equal(SAMPLE.specialization);
        });

        it("assigns doctorId = 1 to the first registration", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.doctorId).to.equal(1);
        });

        it("assigns sequential doctorIds across multiple registrations", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            await registerAs(accounts.patient, accounts.hospital.address); // distinct EOA
            const d1 = await doctorRegistry.getDoctor(accounts.doctor.address);
            const d2 = await doctorRegistry.getDoctor(accounts.patient.address);
            expect(d1.doctorId).to.equal(1);
            expect(d2.doctorId).to.equal(2);
        });

        it("stores the claimed hospital address", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.hospital).to.equal(accounts.hospital.address);
        });

        it("starts with active = true", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.active).to.equal(true);
        });

        it("starts with verified = false", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.verified).to.equal(false);
        });

        it("emits DoctorRegistered with doctorId, wallet and hospital", async () => {
            await expect(registerAs(accounts.doctor, accounts.hospital.address))
                .to.emit(doctorRegistry, "DoctorRegistered")
                .withArgs(1, accounts.doctor.address, accounts.hospital.address, anyValue);
        });

        it("reverts with DoctorAlreadyExists on duplicate registration", async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            await expect(
                registerAs(accounts.doctor, accounts.hospital.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorAlreadyExists");
        });

        it("reverts with ZeroAddress when hospital is address(0)", async () => {
            await expect(
                registerAs(accounts.doctor, ZERO_ADDRESS)
            ).to.be.revertedWithCustomError(doctorRegistry, "ZeroAddress");
        });

        it("reverts with EmptyField when fullNameHash is empty", async () => {
            await expect(
                registerAs(accounts.doctor, accounts.hospital.address, { fullNameHash: "" })
            ).to.be.revertedWithCustomError(doctorRegistry, "EmptyField");
        });

        it("reverts with EmptyField when licenseNumberHash is empty", async () => {
            await expect(
                registerAs(accounts.doctor, accounts.hospital.address, { licenseNumberHash: "" })
            ).to.be.revertedWithCustomError(doctorRegistry, "EmptyField");
        });

        it("reverts with EmptyField when specialization is empty", async () => {
            await expect(
                registerAs(accounts.doctor, accounts.hospital.address, { specialization: "" })
            ).to.be.revertedWithCustomError(doctorRegistry, "EmptyField");
        });
    });

    // -----------------------------------------------------------------
    // 3. verifyDoctor
    // -----------------------------------------------------------------
    describe("verifyDoctor", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
        });

        it("allows admin to verify a registered doctor", async () => {
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorVerified(accounts.doctor.address)).to.equal(true);
        });

        it("sets verified = true on the stored doctor", async () => {
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.verified).to.equal(true);
        });

        it("emits DoctorVerified", async () => {
            await expect(doctorRegistry.verifyDoctor(accounts.doctor.address))
                .to.emit(doctorRegistry, "DoctorVerified")
                .withArgs(accounts.doctor.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                doctorRegistry.connect(accounts.attacker).verifyDoctor(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "Unauthorized");
        });

        it("reverts with DoctorNotFound for an unregistered wallet", async () => {
            await expect(
                doctorRegistry.verifyDoctor(accounts.attacker.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
        });

        it("reverts with AlreadyVerified when verifying twice", async () => {
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            await expect(
                doctorRegistry.verifyDoctor(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "AlreadyVerified");
        });
    });

    // -----------------------------------------------------------------
    // 4. revokeVerification
    // -----------------------------------------------------------------
    describe("revokeVerification", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
        });

        it("allows admin to revoke verification", async () => {
            await doctorRegistry.revokeVerification(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorVerified(accounts.doctor.address)).to.equal(false);
        });

        it("sets verified = false on the stored doctor", async () => {
            await doctorRegistry.revokeVerification(accounts.doctor.address);
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.verified).to.equal(false);
        });

        it("emits DoctorVerificationRevoked", async () => {
            await expect(doctorRegistry.revokeVerification(accounts.doctor.address))
                .to.emit(doctorRegistry, "DoctorVerificationRevoked")
                .withArgs(accounts.doctor.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                doctorRegistry.connect(accounts.attacker).revokeVerification(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "Unauthorized");
        });

        it("reverts with DoctorNotFound for an unregistered wallet", async () => {
            await expect(
                doctorRegistry.revokeVerification(accounts.attacker.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
        });

        it("reverts with NotVerified when the doctor isn't currently verified", async () => {
            await doctorRegistry.revokeVerification(accounts.doctor.address);
            await expect(
                doctorRegistry.revokeVerification(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "NotVerified");
        });
    });

    // -----------------------------------------------------------------
    // 5. updateSpecialization
    // -----------------------------------------------------------------
    describe("updateSpecialization", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
        });

        it("updates the caller's own specialization", async () => {
            await doctorRegistry.connect(accounts.doctor).updateSpecialization("Neurology");
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.specialization).to.equal("Neurology");
        });

        it("emits DoctorUpdated", async () => {
            await expect(
                doctorRegistry.connect(accounts.doctor).updateSpecialization("Neurology")
            )
                .to.emit(doctorRegistry, "DoctorUpdated")
                .withArgs(accounts.doctor.address, anyValue);
        });

        it("reverts with DoctorNotFound for an unregistered caller", async () => {
            await expect(
                doctorRegistry.connect(accounts.attacker).updateSpecialization("Neurology")
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
        });

        it("reverts with DoctorInactive after the doctor deactivates themselves", async () => {
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
            await expect(
                doctorRegistry.connect(accounts.doctor).updateSpecialization("Neurology")
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorInactive");
        });

        it("reverts with EmptyField when new specialization is empty", async () => {
            await expect(
                doctorRegistry.connect(accounts.doctor).updateSpecialization("")
            ).to.be.revertedWithCustomError(doctorRegistry, "EmptyField");
        });
    });

    // -----------------------------------------------------------------
    // 6. deactivateDoctor
    // -----------------------------------------------------------------
    describe("deactivateDoctor", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
        });

        it("deactivates the caller's own profile", async () => {
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
            expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(false);
        });

        it("emits DoctorDeactivated", async () => {
            await expect(doctorRegistry.connect(accounts.doctor).deactivateDoctor())
                .to.emit(doctorRegistry, "DoctorDeactivated")
                .withArgs(accounts.doctor.address, anyValue);
        });

        it("reverts with DoctorNotFound for an unregistered caller", async () => {
            await expect(
                doctorRegistry.connect(accounts.attacker).deactivateDoctor()
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
        });

        it("reverts with DoctorInactive when already deactivated", async () => {
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
            await expect(
                doctorRegistry.connect(accounts.doctor).deactivateDoctor()
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorInactive");
        });
    });

    // -----------------------------------------------------------------
    // 7. reactivateDoctor (admin only)
    // -----------------------------------------------------------------
    describe("reactivateDoctor", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
        });

        it("allows admin to reactivate a deactivated doctor", async () => {
            await doctorRegistry.reactivateDoctor(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(true);
        });

        it("emits DoctorReactivated", async () => {
            await expect(doctorRegistry.reactivateDoctor(accounts.doctor.address))
                .to.emit(doctorRegistry, "DoctorReactivated")
                .withArgs(accounts.doctor.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                doctorRegistry.connect(accounts.attacker).reactivateDoctor(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "Unauthorized");
        });

        it("reverts with DoctorNotFound for an unregistered wallet", async () => {
            await expect(
                doctorRegistry.reactivateDoctor(accounts.other.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
        });

        it("reverts with DoctorAlreadyActive when the doctor is already active", async () => {
            await doctorRegistry.reactivateDoctor(accounts.doctor.address);
            await expect(
                doctorRegistry.reactivateDoctor(accounts.doctor.address)
            ).to.be.revertedWithCustomError(doctorRegistry, "DoctorAlreadyActive");
        });
    });

    // -----------------------------------------------------------------
    // 8. VIEW FUNCTIONS
    // -----------------------------------------------------------------
    describe("View functions", () => {
        describe("getDoctor", () => {
            it("returns the stored doctor for a registered wallet", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
                expect(doctor.wallet).to.equal(accounts.doctor.address);
            });

            it("reverts with DoctorNotFound for an unregistered wallet", async () => {
                await expect(
                    doctorRegistry.getDoctor(accounts.attacker.address)
                ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
            });
        });

        describe("isDoctorActive", () => {
            it("returns true for an active registered doctor", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(true);
            });

            it("returns false after deactivation", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
                expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(false);
            });

            it("returns false (no revert) for an unknown wallet", async () => {
                expect(await doctorRegistry.isDoctorActive(accounts.attacker.address)).to.equal(false);
            });
        });

        describe("isDoctorVerified", () => {
            it("returns false immediately after registration", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                expect(await doctorRegistry.isDoctorVerified(accounts.doctor.address)).to.equal(false);
            });

            it("returns true after admin verification", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                await doctorRegistry.verifyDoctor(accounts.doctor.address);
                expect(await doctorRegistry.isDoctorVerified(accounts.doctor.address)).to.equal(true);
            });
        });

        describe("getDoctorHospital", () => {
            it("returns the registered hospital address", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                expect(await doctorRegistry.getDoctorHospital(accounts.doctor.address)).to.equal(
                    accounts.hospital.address
                );
            });

            it("reverts with DoctorNotFound for an unknown doctor", async () => {
                await expect(
                    doctorRegistry.getDoctorHospital(accounts.attacker.address)
                ).to.be.revertedWithCustomError(doctorRegistry, "DoctorNotFound");
            });
        });

        describe("totalDoctors", () => {
            it("counts registrations correctly", async () => {
                await registerAs(accounts.doctor, accounts.hospital.address);
                await registerAs(accounts.patient, accounts.hospital.address);
                expect(await doctorRegistry.totalDoctors()).to.equal(2);
            });
        });
    });

    // -----------------------------------------------------------------
    // 9. EDGE CASES
    // -----------------------------------------------------------------
    describe("Edge cases", () => {
        beforeEach(async () => {
            await registerAs(accounts.doctor, accounts.hospital.address);
        });

        it("supports verify → revoke → verify again", async () => {
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            await doctorRegistry.revokeVerification(accounts.doctor.address);
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorVerified(accounts.doctor.address)).to.equal(true);
        });

        it("supports deactivate then reactivate", async () => {
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
            await doctorRegistry.reactivateDoctor(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(true);
        });

        it("allows the doctor to update specialization after reactivation", async () => {
            await doctorRegistry.connect(accounts.doctor).deactivateDoctor();
            await doctorRegistry.reactivateDoctor(accounts.doctor.address);
            await doctorRegistry.connect(accounts.doctor).updateSpecialization("Oncology");
            const doctor = await doctorRegistry.getDoctor(accounts.doctor.address);
            expect(doctor.specialization).to.equal("Oncology");
        });

        it("two different doctors do not overwrite each other's data", async () => {
            await registerAs(accounts.patient, accounts.other.address, {
                specialization: "Pediatrics",
            });

            const d1 = await doctorRegistry.getDoctor(accounts.doctor.address);
            const d2 = await doctorRegistry.getDoctor(accounts.patient.address);

            expect(d1.specialization).to.equal(SAMPLE.specialization);
            expect(d1.hospital).to.equal(accounts.hospital.address);
            expect(d2.specialization).to.equal("Pediatrics");
            expect(d2.hospital).to.equal(accounts.other.address);
        });

        it("an admin promoted via AccessControl can verify doctors", async () => {
            // Promote another account to Admin
            await accessControl.assignRole(accounts.admin.address, Role.Admin);

            // Newly promoted admin verifies the registered doctor
            await doctorRegistry
                .connect(accounts.admin)
                .verifyDoctor(accounts.doctor.address);

            expect(
                await doctorRegistry.isDoctorVerified(accounts.doctor.address)
            ).to.equal(true);
        });

        it("revoking verification does not deactivate the doctor", async () => {
            await doctorRegistry.verifyDoctor(accounts.doctor.address);
            await doctorRegistry.revokeVerification(accounts.doctor.address);
            expect(await doctorRegistry.isDoctorActive(accounts.doctor.address)).to.equal(true);
        });
    });
});