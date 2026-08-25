import { expect } from "chai";
import { deployAccessControl } from "./helpers/deploy";
import type { TestAccounts } from "./helpers/accounts";

// Mirrors the Solidity enum: None, Patient, Doctor, Hospital, Admin
const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Hospital: 3,
    Admin: 4,
} as const;

describe("AccessControl", () => {
    let accessControl: any;
    let accounts: TestAccounts;

    beforeEach(async () => {
        const deployment = await deployAccessControl();
        accessControl = deployment.accessControl;
        accounts = deployment.accounts;
    });

    // -----------------------------------------------------------------
    // DEPLOYMENT
    // -----------------------------------------------------------------
    describe("Deployment", () => {
        it("sets the deployer correctly", async () => {
            expect(await accessControl.deployer()).to.equal(accounts.owner.address);
        });

        it("assigns the deployer the Admin role", async () => {
            expect(await accessControl.getRole(accounts.owner.address)).to.equal(Role.Admin);
        });

        it("starts with adminCount = 1", async () => {
            expect(await accessControl.adminCount()).to.equal(1);
        });

        it("emits RoleAssigned for the deployer on construction", async () => {
            const tx = accessControl.deploymentTransaction();
            await expect(tx)
                .to.emit(accessControl, "RoleAssigned")
                .withArgs(accounts.owner.address, Role.Admin);
        });

        it("gives an unassigned account Role.None by default", async () => {
            expect(await accessControl.getRole(accounts.other.address)).to.equal(Role.None);
        });
    });

    // -----------------------------------------------------------------
    // ROLE ASSIGNMENT
    // -----------------------------------------------------------------
    describe("assignRole", () => {
        it("allows admin to assign Patient role", async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
            expect(await accessControl.getRole(accounts.patient.address)).to.equal(Role.Patient);
        });

        it("allows admin to assign Doctor role", async () => {
            await accessControl.assignRole(accounts.doctor.address, Role.Doctor);
            expect(await accessControl.isDoctor(accounts.doctor.address)).to.equal(true);
        });

        it("allows admin to assign Hospital role", async () => {
            await accessControl.assignRole(accounts.hospital.address, Role.Hospital);
            expect(await accessControl.isHospital(accounts.hospital.address)).to.equal(true);
        });

        it("allows admin to assign a new Admin and increments adminCount", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin);
            expect(await accessControl.adminCount()).to.equal(2);
            expect(await accessControl.isAdmin(accounts.admin.address)).to.equal(true);
        });

        it("emits RoleAssigned with correct args", async () => {
            await expect(accessControl.assignRole(accounts.patient.address, Role.Patient))
                .to.emit(accessControl, "RoleAssigned")
                .withArgs(accounts.patient.address, Role.Patient);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                accessControl.connect(accounts.attacker).assignRole(accounts.patient.address, Role.Patient)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
        });

        it("reverts with ZeroAddress when account is address(0)", async () => {
            await expect(
                accessControl.assignRole(
                    "0x0000000000000000000000000000000000000000",
                    Role.Patient
                )
            ).to.be.revertedWithCustomError(accessControl, "ZeroAddress");
        });

        it("reverts with InvalidRole when assigning Role.None", async () => {
            await expect(
                accessControl.assignRole(accounts.patient.address, Role.None)
            ).to.be.revertedWithCustomError(accessControl, "InvalidRole");
        });

        it("reverts with AlreadyAssigned when account already has a role", async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
            await expect(
                accessControl.assignRole(accounts.patient.address, Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "AlreadyAssigned");
        });
    });

    // -----------------------------------------------------------------
    // ROLE UPDATE
    // -----------------------------------------------------------------
    describe("updateRole", () => {
        beforeEach(async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
        });

        it("allows admin to change an existing role", async () => {
            await accessControl.updateRole(accounts.patient.address, Role.Doctor);
            expect(await accessControl.getRole(accounts.patient.address)).to.equal(Role.Doctor);
        });

        it("emits RoleUpdated with old and new role", async () => {
            await expect(accessControl.updateRole(accounts.patient.address, Role.Doctor))
                .to.emit(accessControl, "RoleUpdated")
                .withArgs(accounts.patient.address, Role.Patient, Role.Doctor);
        });

        it("increments adminCount when promoting to Admin", async () => {
            await accessControl.updateRole(accounts.patient.address, Role.Admin);
            expect(await accessControl.adminCount()).to.equal(2);
        });

        it("decrements adminCount when demoting an admin (with other admins present)", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin); // adminCount = 2
            await accessControl.updateRole(accounts.admin.address, Role.Doctor);
            expect(await accessControl.adminCount()).to.equal(1);
        });

        it("reverts with CannotRevokeLastAdmin when demoting the sole admin", async () => {
            await expect(
                accessControl.updateRole(accounts.owner.address, Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "CannotRevokeLastAdmin");
        });

        it("reverts with NoRoleAssigned when account has no role", async () => {
            await expect(
                accessControl.updateRole(accounts.other.address, Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "NoRoleAssigned");
        });

        it("reverts with InvalidRole when newRole is Role.None", async () => {
            await expect(
                accessControl.updateRole(accounts.patient.address, Role.None)
            ).to.be.revertedWithCustomError(accessControl, "InvalidRole");
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                accessControl.connect(accounts.attacker).updateRole(accounts.patient.address, Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
        });

        it("reverts with ZeroAddress when account is address(0)", async () => {
            await expect(
                accessControl.updateRole("0x0000000000000000000000000000000000000000", Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "ZeroAddress");
        });
    });

    // -----------------------------------------------------------------
    // ROLE REVOCATION
    // -----------------------------------------------------------------
    describe("revokeRole", () => {
        beforeEach(async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
        });

        it("allows admin to revoke an existing role", async () => {
            await accessControl.revokeRole(accounts.patient.address);
            expect(await accessControl.getRole(accounts.patient.address)).to.equal(Role.None);
        });

        it("emits RoleRevoked with the previous role", async () => {
            await expect(accessControl.revokeRole(accounts.patient.address))
                .to.emit(accessControl, "RoleRevoked")
                .withArgs(accounts.patient.address, Role.Patient);
        });

        it("decrements adminCount when revoking a non-last admin", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin); // adminCount = 2
            await accessControl.revokeRole(accounts.admin.address);
            expect(await accessControl.adminCount()).to.equal(1);
        });

        it("reverts with CannotRevokeLastAdmin when revoking the sole admin", async () => {
            await expect(
                accessControl.revokeRole(accounts.owner.address)
            ).to.be.revertedWithCustomError(accessControl, "CannotRevokeLastAdmin");
        });

        it("reverts with NoRoleAssigned when account has no role", async () => {
            await expect(
                accessControl.revokeRole(accounts.other.address)
            ).to.be.revertedWithCustomError(accessControl, "NoRoleAssigned");
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                accessControl.connect(accounts.attacker).revokeRole(accounts.patient.address)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
        });

        it("reverts with ZeroAddress when account is address(0)", async () => {
            await expect(
                accessControl.revokeRole("0x0000000000000000000000000000000000000000")
            ).to.be.revertedWithCustomError(accessControl, "ZeroAddress");
        });

        it("allows re-assigning a role after revocation", async () => {
            await accessControl.revokeRole(accounts.patient.address);
            await accessControl.assignRole(accounts.patient.address, Role.Doctor);
            expect(await accessControl.getRole(accounts.patient.address)).to.equal(Role.Doctor);
        });
    });

    // -----------------------------------------------------------------
    // VIEW FUNCTIONS
    // -----------------------------------------------------------------
    describe("View functions", () => {
        it("isAdmin / isDoctor / isHospital / isPatient reflect assigned roles", async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
            await accessControl.assignRole(accounts.doctor.address, Role.Doctor);
            await accessControl.assignRole(accounts.hospital.address, Role.Hospital);

            expect(await accessControl.isPatient(accounts.patient.address)).to.equal(true);
            expect(await accessControl.isDoctor(accounts.doctor.address)).to.equal(true);
            expect(await accessControl.isHospital(accounts.hospital.address)).to.equal(true);
            expect(await accessControl.isAdmin(accounts.owner.address)).to.equal(true);

            // cross-checks: a Patient is not also a Doctor/Hospital/Admin
            expect(await accessControl.isDoctor(accounts.patient.address)).to.equal(false);
            expect(await accessControl.isHospital(accounts.patient.address)).to.equal(false);
            expect(await accessControl.isAdmin(accounts.patient.address)).to.equal(false);
        });

        it("getRole returns None for an account that was never assigned", async () => {
            expect(await accessControl.getRole(accounts.attacker.address)).to.equal(Role.None);
        });
    });

    // -----------------------------------------------------------------
    // EDGE CASES
    // -----------------------------------------------------------------
    describe("Edge cases", () => {
        it("adminCount tracks multiple sequential admin promotions and demotions", async () => {
            await accessControl.assignRole(accounts.admin.address, Role.Admin);
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
            await accessControl.updateRole(accounts.patient.address, Role.Admin);
            expect(await accessControl.adminCount()).to.equal(3);

            await accessControl.revokeRole(accounts.admin.address);
            expect(await accessControl.adminCount()).to.equal(2);
        });

        it("does not allow assigning the same account twice even with the same role", async () => {
            await accessControl.assignRole(accounts.patient.address, Role.Patient);
            await expect(
                accessControl.assignRole(accounts.patient.address, Role.Patient)
            ).to.be.revertedWithCustomError(accessControl, "AlreadyAssigned");
        });

        it("a non-admin role holder cannot call any admin-only function", async () => {
            await accessControl.assignRole(accounts.doctor.address, Role.Doctor);
            const asDoctor = accessControl.connect(accounts.doctor);

            await expect(
                asDoctor.assignRole(accounts.other.address, Role.Patient)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");

            await expect(
                asDoctor.updateRole(accounts.owner.address, Role.Doctor)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");

            await expect(
                asDoctor.revokeRole(accounts.owner.address)
            ).to.be.revertedWithCustomError(accessControl, "Unauthorized");
        });
    });
});