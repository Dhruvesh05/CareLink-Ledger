import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { deployHospitalRegistry } from "./helpers/deploy";
import type { TestAccounts } from "./helpers/accounts";

const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Hospital: 3,
    Admin: 4,
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SAMPLE = {
    hospitalNameHash: "0x" + "55".repeat(32),
    registrationNumberHash: "0x" + "66".repeat(32),
    locationHash: "0x" + "77".repeat(32),
};

describe("HospitalRegistry", () => {
    let hospitalRegistry: any;
    let accessControl: any;
    let accounts: TestAccounts;

    beforeEach(async () => {
        const deployment = await deployHospitalRegistry();
        hospitalRegistry = deployment.hospitalRegistry;
        accessControl = deployment.accessControl;
        accounts = deployment.accounts;
    });

    async function registerAs(signer: any, overrides: Partial<typeof SAMPLE> = {}) {
        const data = { ...SAMPLE, ...overrides };
        return hospitalRegistry
            .connect(signer)
            .registerHospital(data.hospitalNameHash, data.registrationNumberHash, data.locationHash);
    }

    // -----------------------------------------------------------------
    // 1. DEPLOYMENT
    // -----------------------------------------------------------------
    describe("Deployment", () => {
        it("stores the AccessControl address", async () => {
            expect(await hospitalRegistry.accessControl()).to.equal(
                await accessControl.getAddress()
            );
        });

        it("reverts on construction with a zero AccessControl address", async () => {
            const { network } = await import("hardhat");
            const { ethers } = await network.connect();
            const Factory = await ethers.getContractFactory("HospitalRegistry");
            await expect(Factory.deploy(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                Factory,
                "ZeroAddress"
            );
        });

        it("starts with totalHospitals() == 0", async () => {
            expect(await hospitalRegistry.totalHospitals()).to.equal(0);
        });

        it("assigns the first registered hospital id == 1", async () => {
            await registerAs(accounts.hospital);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.hospitalId).to.equal(1);
        });
    });

    // -----------------------------------------------------------------
    // 2. registerHospital
    // -----------------------------------------------------------------
    describe("registerHospital", () => {
        it("registers a new hospital successfully", async () => {
            await registerAs(accounts.hospital);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);

            expect(hospital.wallet).to.equal(accounts.hospital.address);
            expect(hospital.hospitalNameHash).to.equal(SAMPLE.hospitalNameHash);
            expect(hospital.registrationNumberHash).to.equal(SAMPLE.registrationNumberHash);
            expect(hospital.locationHash).to.equal(SAMPLE.locationHash);
        });

        it("assigns hospitalId = 1 to the first registration", async () => {
            await registerAs(accounts.hospital);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.hospitalId).to.equal(1);
        });

        it("assigns sequential hospitalIds across multiple registrations", async () => {
            await registerAs(accounts.hospital);
            await registerAs(accounts.doctor); // distinct EOA reused as a second registrant
            const h1 = await hospitalRegistry.getHospital(accounts.hospital.address);
            const h2 = await hospitalRegistry.getHospital(accounts.doctor.address);
            expect(h1.hospitalId).to.equal(1);
            expect(h2.hospitalId).to.equal(2);
        });

        it("starts with active = true", async () => {
            await registerAs(accounts.hospital);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.active).to.equal(true);
        });

        it("starts with verified = false", async () => {
            await registerAs(accounts.hospital);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.verified).to.equal(false);
        });

        it("emits HospitalRegistered with hospitalId and wallet", async () => {
            await expect(registerAs(accounts.hospital))
                .to.emit(hospitalRegistry, "HospitalRegistered")
                .withArgs(1, accounts.hospital.address, anyValue);
        });

        it("reverts with HospitalAlreadyExists on duplicate registration", async () => {
            await registerAs(accounts.hospital);
            await expect(registerAs(accounts.hospital)).to.be.revertedWithCustomError(
                hospitalRegistry,
                "HospitalAlreadyExists"
            );
        });

        it("reverts with EmptyField when hospitalNameHash is empty", async () => {
            await expect(
                registerAs(accounts.hospital, { hospitalNameHash: "" })
            ).to.be.revertedWithCustomError(hospitalRegistry, "EmptyField");
        });

        it("reverts with EmptyField when registrationNumberHash is empty", async () => {
            await expect(
                registerAs(accounts.hospital, { registrationNumberHash: "" })
            ).to.be.revertedWithCustomError(hospitalRegistry, "EmptyField");
        });

        it("reverts with EmptyField when locationHash is empty", async () => {
            await expect(
                registerAs(accounts.hospital, { locationHash: "" })
            ).to.be.revertedWithCustomError(hospitalRegistry, "EmptyField");
        });

        it("allows any address (no role requirement) to self-register", async () => {
            // Design note: registerHospital has no onlyAdmin/onlyRole gate —
            // it's self-service, same pattern as PatientRegistry/DoctorRegistry.
            // Locks in this intentional design so a future role-gate addition
            // doesn't slip through silently.
            await registerAs(accounts.attacker);

            expect(
                await hospitalRegistry.isHospitalActive(accounts.attacker.address)
            ).to.equal(true);        
        });
    });

    // -----------------------------------------------------------------
    // 3. verifyHospital
    // -----------------------------------------------------------------
    describe("verifyHospital", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
        });

        it("allows admin to verify a registered hospital", async () => {
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalVerified(accounts.hospital.address)).to.equal(true);
        });

        it("sets verified = true on the stored hospital", async () => {
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.verified).to.equal(true);
        });

        it("emits HospitalVerified", async () => {
            await expect(hospitalRegistry.verifyHospital(accounts.hospital.address))
                .to.emit(hospitalRegistry, "HospitalVerified")
                .withArgs(accounts.hospital.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                hospitalRegistry.connect(accounts.attacker).verifyHospital(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "Unauthorized");
        });

        it("reverts with HospitalNotFound for an unregistered wallet", async () => {
            await expect(
                hospitalRegistry.verifyHospital(accounts.attacker.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
        });

        it("reverts with AlreadyVerified when verifying twice", async () => {
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            await expect(
                hospitalRegistry.verifyHospital(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "AlreadyVerified");
        });
    });

    // -----------------------------------------------------------------
    // 4. revokeVerification
    // -----------------------------------------------------------------
    describe("revokeVerification", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
        });

        it("allows admin to revoke verification", async () => {
            await hospitalRegistry.revokeVerification(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalVerified(accounts.hospital.address)).to.equal(false);
        });

        it("sets verified = false on the stored hospital", async () => {
            await hospitalRegistry.revokeVerification(accounts.hospital.address);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.verified).to.equal(false);
        });

        it("emits HospitalVerificationRevoked", async () => {
            await expect(hospitalRegistry.revokeVerification(accounts.hospital.address))
                .to.emit(hospitalRegistry, "HospitalVerificationRevoked")
                .withArgs(accounts.hospital.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                hospitalRegistry.connect(accounts.attacker).revokeVerification(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "Unauthorized");
        });

        it("reverts with HospitalNotFound for an unregistered wallet", async () => {
            await expect(
                hospitalRegistry.revokeVerification(accounts.attacker.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
        });

        it("reverts with NotVerified when the hospital isn't currently verified", async () => {
            await hospitalRegistry.revokeVerification(accounts.hospital.address);
            await expect(
                hospitalRegistry.revokeVerification(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "NotVerified");
        });
    });

    // -----------------------------------------------------------------
    // 5. updateLocation
    // -----------------------------------------------------------------
    describe("updateLocation", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
        });

        it("updates the caller's own location", async () => {
            const newLocation = "0x" + "88".repeat(32);
            await hospitalRegistry.connect(accounts.hospital).updateLocation(newLocation);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.locationHash).to.equal(newLocation);
        });

        it("emits HospitalUpdated", async () => {
            const newLocation = "0x" + "88".repeat(32);
            await expect(
                hospitalRegistry.connect(accounts.hospital).updateLocation(newLocation)
            )
                .to.emit(hospitalRegistry, "HospitalUpdated")
                .withArgs(accounts.hospital.address, anyValue);
        });

        it("reverts with HospitalNotFound for an unregistered caller", async () => {
            await expect(
                hospitalRegistry.connect(accounts.attacker).updateLocation("0x" + "88".repeat(32))
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
        });

        it("reverts with HospitalInactive after the hospital deactivates itself", async () => {
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
            await expect(
                hospitalRegistry.connect(accounts.hospital).updateLocation("0x" + "88".repeat(32))
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalInactive");
        });

        it("reverts with EmptyField when the new location is empty", async () => {
            await expect(
                hospitalRegistry.connect(accounts.hospital).updateLocation("")
            ).to.be.revertedWithCustomError(hospitalRegistry, "EmptyField");
        });
    });

    // -----------------------------------------------------------------
    // 6. deactivateHospital
    // -----------------------------------------------------------------
    describe("deactivateHospital", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
        });

        it("deactivates the caller's own profile", async () => {
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
            expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(false);
        });

        it("emits HospitalDeactivated", async () => {
            await expect(hospitalRegistry.connect(accounts.hospital).deactivateHospital())
                .to.emit(hospitalRegistry, "HospitalDeactivated")
                .withArgs(accounts.hospital.address, anyValue);
        });

        it("reverts with HospitalNotFound for an unregistered caller", async () => {
            await expect(
                hospitalRegistry.connect(accounts.attacker).deactivateHospital()
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
        });

        it("reverts with HospitalInactive when already deactivated", async () => {
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
            await expect(
                hospitalRegistry.connect(accounts.hospital).deactivateHospital()
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalInactive");
        });
    });

    // -----------------------------------------------------------------
    // 7. reactivateHospital (admin only)
    // -----------------------------------------------------------------
    describe("reactivateHospital", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
        });

        it("allows admin to reactivate a deactivated hospital", async () => {
            await hospitalRegistry.reactivateHospital(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(true);
        });

        it("emits HospitalReactivated", async () => {
            await expect(hospitalRegistry.reactivateHospital(accounts.hospital.address))
                .to.emit(hospitalRegistry, "HospitalReactivated")
                .withArgs(accounts.hospital.address, anyValue);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                hospitalRegistry.connect(accounts.attacker).reactivateHospital(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "Unauthorized");
        });

        it("reverts with HospitalNotFound for an unregistered wallet", async () => {
            await expect(
                hospitalRegistry.reactivateHospital(accounts.other.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
        });

        it("reverts with HospitalAlreadyActive when the hospital is already active", async () => {
            await hospitalRegistry.reactivateHospital(accounts.hospital.address);
            await expect(
                hospitalRegistry.reactivateHospital(accounts.hospital.address)
            ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalAlreadyActive");
        });
    });

    // -----------------------------------------------------------------
    // 8. VIEW FUNCTIONS
    // -----------------------------------------------------------------
    describe("View functions", () => {
        describe("getHospital", () => {
            it("returns the stored hospital for a registered wallet", async () => {
                await registerAs(accounts.hospital);
                const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
                expect(hospital.wallet).to.equal(accounts.hospital.address);
            });

            it("reverts with HospitalNotFound for an unregistered wallet", async () => {
                await expect(
                    hospitalRegistry.getHospital(accounts.attacker.address)
                ).to.be.revertedWithCustomError(hospitalRegistry, "HospitalNotFound");
            });
        });

        describe("isHospitalActive", () => {
            it("returns true for an active registered hospital", async () => {
                await registerAs(accounts.hospital);
                expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(true);
            });

            it("returns false after deactivation", async () => {
                await registerAs(accounts.hospital);
                await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
                expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(false);
            });

            it("returns false (no revert) for an unknown wallet", async () => {
                expect(await hospitalRegistry.isHospitalActive(accounts.attacker.address)).to.equal(false);
            });
        });

        describe("isHospitalVerified", () => {
            it("returns false immediately after registration", async () => {
                await registerAs(accounts.hospital);
                expect(await hospitalRegistry.isHospitalVerified(accounts.hospital.address)).to.equal(false);
            });

            it("returns true after admin verification", async () => {
                await registerAs(accounts.hospital);
                await hospitalRegistry.verifyHospital(accounts.hospital.address);
                expect(await hospitalRegistry.isHospitalVerified(accounts.hospital.address)).to.equal(true);
            });

            it("returns false (no revert) for an unknown wallet", async () => {
                expect(await hospitalRegistry.isHospitalVerified(accounts.attacker.address)).to.equal(false);
            });
        });

        describe("totalHospitals", () => {
            it("counts registrations correctly", async () => {
                await registerAs(accounts.hospital);
                await registerAs(accounts.doctor);
                expect(await hospitalRegistry.totalHospitals()).to.equal(2);
            });
        });
    });

    // -----------------------------------------------------------------
    // 9. EDGE CASES
    // -----------------------------------------------------------------
    describe("Edge cases", () => {
        beforeEach(async () => {
            await registerAs(accounts.hospital);
        });

        it("supports verify → revoke → verify again", async () => {
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            await hospitalRegistry.revokeVerification(accounts.hospital.address);
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalVerified(accounts.hospital.address)).to.equal(true);
        });

        it("supports deactivate then reactivate", async () => {
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
            await hospitalRegistry.reactivateHospital(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(true);
        });

        it("allows the hospital to update location after reactivation", async () => {
            const newLocation = "0x" + "99".repeat(32);
            await hospitalRegistry.connect(accounts.hospital).deactivateHospital();
            await hospitalRegistry.reactivateHospital(accounts.hospital.address);
            await hospitalRegistry.connect(accounts.hospital).updateLocation(newLocation);
            const hospital = await hospitalRegistry.getHospital(accounts.hospital.address);
            expect(hospital.locationHash).to.equal(newLocation);
        });

        it("two different hospitals do not overwrite each other's data", async () => {
            await registerAs(accounts.doctor, { locationHash: "0x" + "aa".repeat(32) });

            const h1 = await hospitalRegistry.getHospital(accounts.hospital.address);
            const h2 = await hospitalRegistry.getHospital(accounts.doctor.address);

            expect(h1.locationHash).to.equal(SAMPLE.locationHash);
            expect(h2.locationHash).to.equal("0x" + "aa".repeat(32));
        });

        it("an admin promoted via AccessControl can verify hospitals", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin);
            await hospitalRegistry
                .connect(accounts.admin)
                .verifyHospital(accounts.hospital.address);

            expect(
                await hospitalRegistry.isHospitalVerified(accounts.hospital.address)
            ).to.equal(true);
        });

        it("revoking verification does not deactivate the hospital", async () => {
            await hospitalRegistry.verifyHospital(accounts.hospital.address);
            await hospitalRegistry.revokeVerification(accounts.hospital.address);
            expect(await hospitalRegistry.isHospitalActive(accounts.hospital.address)).to.equal(true);
        });
    });
});