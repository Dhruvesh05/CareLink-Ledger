import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { deployAuditLog } from "./helpers/deploy";
import type { TestAccounts } from "./helpers/accounts";

const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Hospital: 3,
    Admin: 4,
} as const;

// Mirrors IAuditLog.Action
const Action = {
    CREATE_RECORD: 0,
    UPDATE_RECORD: 1,
    VIEW_RECORD: 2,
    DOWNLOAD_RECORD: 3,
    GRANT_ACCESS: 4,
    REVOKE_ACCESS: 5,
    DEACTIVATE_RECORD: 6,
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("AuditLog", () => {
    let ethers: any;
    let auditLog: any;
    let accessControl: any;
    let accounts: TestAccounts;

    beforeEach(async () => {
        const deployment = await deployAuditLog();

        ethers = deployment.ethers;
        accounts = deployment.accounts;
        accessControl = deployment.accessControl;
        auditLog = deployment.auditLog;
    });

    /** Configures accounts.other as the "MedicalRecord" caller for a test. */
    async function configureWriter(writer = accounts.other) {
        await auditLog.setMedicalRecordContract(writer.address);
        return writer;
    }

    // -----------------------------------------------------------------
    // 1. DEPLOYMENT
    // -----------------------------------------------------------------
    describe("Deployment", () => {
        it("stores the AccessControl address", async () => {
            expect(await auditLog.accessControl()).to.equal(await accessControl.getAddress());
        });

        it("starts with medicalRecordContract unset (zero address)", async () => {
            expect(await auditLog.medicalRecordContract()).to.equal(ZERO_ADDRESS);
        });

        it("starts with totalAuditLogs() == 0", async () => {
            expect(await auditLog.totalAuditLogs()).to.equal(0);
        });

        it("reverts on construction with a zero AccessControl address", async () => {
            const { network } = await import("hardhat");
            const { ethers: freshEthers } = await network.create();
            const Factory = await freshEthers.getContractFactory("AuditLog");
            await expect(Factory.deploy(ZERO_ADDRESS)).to.be.revertedWithCustomError(
                Factory,
                "ZeroAddress"
            );
        });
    });

    // -----------------------------------------------------------------
    // 2. setMedicalRecordContract
    // -----------------------------------------------------------------
    describe("setMedicalRecordContract", () => {
        it("allows admin to set the MedicalRecord contract address", async () => {
            await auditLog.setMedicalRecordContract(accounts.other.address);
            expect(await auditLog.medicalRecordContract()).to.equal(accounts.other.address);
        });

        it("allows admin to rotate to a new MedicalRecord address", async () => {
            await auditLog.setMedicalRecordContract(accounts.other.address);
            await auditLog.setMedicalRecordContract(accounts.attacker.address);
            expect(await auditLog.medicalRecordContract()).to.equal(accounts.attacker.address);
        });

        it("emits MedicalRecordContractUpdated with previous and current addresses", async () => {
            await expect(auditLog.setMedicalRecordContract(accounts.other.address))
                .to.emit(auditLog, "MedicalRecordContractUpdated")
                .withArgs(ZERO_ADDRESS, accounts.other.address);
        });

        it("emits MedicalRecordContractUpdated with the correct previous value on rotation", async () => {
            await auditLog.setMedicalRecordContract(accounts.other.address);
            await expect(auditLog.setMedicalRecordContract(accounts.attacker.address))
                .to.emit(auditLog, "MedicalRecordContractUpdated")
                .withArgs(accounts.other.address, accounts.attacker.address);
        });

        it("reverts with Unauthorized when caller is not admin", async () => {
            await expect(
                auditLog.connect(accounts.attacker).setMedicalRecordContract(accounts.other.address)
            ).to.be.revertedWithCustomError(auditLog, "Unauthorized");
        });

        it("reverts with ZeroAddress when setting to address(0)", async () => {
            await expect(
                auditLog.setMedicalRecordContract(ZERO_ADDRESS)
            ).to.be.revertedWithCustomError(auditLog, "ZeroAddress");
        });
    });

    // -----------------------------------------------------------------
    // 3. createAudit
    // -----------------------------------------------------------------
    describe("createAudit", () => {
        it("reverts with MedicalRecordContractNotSet before any address is configured", async () => {
            await expect(
                auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "note")
            ).to.be.revertedWithCustomError(auditLog, "MedicalRecordContractNotSet");
        });

        describe("once medicalRecordContract is configured", () => {
            beforeEach(async () => {
                await configureWriter();
            });

            it("allows the configured address to create an audit entry", async () => {
                await expect(
                    auditLog
                        .connect(accounts.other)
                        .createAudit(1, accounts.patient.address, Action.CREATE_RECORD, "created")
                ).to.not.be.revert(ethers);
            });

            it("reverts with Unauthorized when called by any other address (including admin)", async () => {
                await expect(
                    auditLog.createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "note")
                ).to.be.revertedWithCustomError(auditLog, "Unauthorized");

                await expect(
                    auditLog
                        .connect(accounts.attacker)
                        .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "note")
                ).to.be.revertedWithCustomError(auditLog, "Unauthorized");
            });

            it("returns sequential log IDs starting at 1", async () => {
                const firstId = await auditLog
                    .connect(accounts.other)
                    .createAudit.staticCall(1, accounts.doctor.address, Action.CREATE_RECORD, "a");
                expect(firstId).to.equal(1);

                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");

                const secondId = await auditLog
                    .connect(accounts.other)
                    .createAudit.staticCall(2, accounts.doctor.address, Action.UPDATE_RECORD, "b");
                expect(secondId).to.equal(2);
            });

            it("increments totalAuditLogs() with each call", async () => {
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");
                expect(await auditLog.totalAuditLogs()).to.equal(1);

                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.UPDATE_RECORD, "b");
                expect(await auditLog.totalAuditLogs()).to.equal(2);
            });

            it("stores recordId, performer, action, timestamp and details correctly", async () => {
                await auditLog
                    .connect(accounts.other)
                    .createAudit(42, accounts.doctor.address, Action.VIEW_RECORD, "viewed by doctor");

                const entry = await auditLog.getAudit(1);
                expect(entry.logId).to.equal(1);
                expect(entry.recordId).to.equal(42);
                expect(entry.performedBy).to.equal(accounts.doctor.address);
                expect(entry.action).to.equal(Action.VIEW_RECORD);
                expect(entry.details).to.equal("viewed by doctor");
                expect(entry.timestamp).to.be.greaterThan(0);
            });

            it("pushes the new logId into that record's audit log list", async () => {
                await auditLog
                    .connect(accounts.other)
                    .createAudit(7, accounts.doctor.address, Action.CREATE_RECORD, "a");
                const ids = await auditLog.getRecordAuditLogs(7);
                expect(ids.map((id: bigint) => Number(id))).to.deep.equal([1]);
            });

            it("emits AuditRecorded with logId, recordId, performer and action", async () => {
                await expect(
                    auditLog
                        .connect(accounts.other)
                        .createAudit(7, accounts.doctor.address, Action.CREATE_RECORD, "a")
                )
                    .to.emit(auditLog, "AuditRecorded")
                    .withArgs(1, 7, accounts.doctor.address, Action.CREATE_RECORD, anyValue);
            });

            it("uses the explicit `performer` argument, not msg.sender, as performedBy", async () => {
                // msg.sender here is accounts.other (the configured MedicalRecord
                // stand-in); performedBy should reflect the passed-in performer
                // (accounts.doctor), confirming AuditLog never substitutes
                // msg.sender or tx.origin for the real actor.
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");
                const entry = await auditLog.getAudit(1);
                expect(entry.performedBy).to.equal(accounts.doctor.address);
                expect(entry.performedBy).to.not.equal(accounts.other.address);
            });

            it("accepts every Action enum value", async () => {
                const actions = Object.values(Action).filter(
                    (v): v is number => typeof v === "number"
                );
                for (const action of actions) {
                    await expect(
                        auditLog
                            .connect(accounts.other)
                            .createAudit(1, accounts.patient.address, action, "details")
                    ).to.not.be.revert(ethers);
                }
                expect(await auditLog.totalAuditLogs()).to.equal(actions.length);
            });
        });
    });

    // -----------------------------------------------------------------
    // 4. VIEW FUNCTIONS
    // -----------------------------------------------------------------
    describe("View functions", () => {
        describe("getAudit", () => {
            it("returns the stored entry for a valid logId", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");

                const entry = await auditLog.getAudit(1);
                expect(entry.logId).to.equal(1);
            });

            it("reverts with AuditNotFound for logId == 0", async () => {
                await expect(auditLog.getAudit(0)).to.be.revertedWithCustomError(
                    auditLog,
                    "AuditNotFound"
                );
            });

            it("reverts with AuditNotFound for a logId that has never been created", async () => {
                await expect(auditLog.getAudit(999)).to.be.revertedWithCustomError(
                    auditLog,
                    "AuditNotFound"
                );
            });

            it("reverts with AuditNotFound for logId == _nextLogId (one past the last created)", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");
                // Only logId 1 exists; logId 2 == _nextLogId and must revert.
                await expect(auditLog.getAudit(2)).to.be.revertedWithCustomError(
                    auditLog,
                    "AuditNotFound"
                );
            });
        });

        describe("getRecordAuditLogs", () => {
            it("returns an empty array for a record with no audit entries", async () => {
                const ids = await auditLog.getRecordAuditLogs(123);
                expect(ids).to.deep.equal([]);
            });

            it("returns a single-element array after one entry", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(5, accounts.doctor.address, Action.CREATE_RECORD, "a");
                const ids = await auditLog.getRecordAuditLogs(5);
                expect(ids.map((id: bigint) => Number(id))).to.deep.equal([1]);
            });

            it("returns multiple log IDs in chronological order for the same record", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(5, accounts.doctor.address, Action.CREATE_RECORD, "a");
                await auditLog
                    .connect(accounts.other)
                    .createAudit(5, accounts.doctor.address, Action.UPDATE_RECORD, "b");
                await auditLog
                    .connect(accounts.other)
                    .createAudit(5, accounts.doctor.address, Action.VIEW_RECORD, "c");

                const ids = await auditLog.getRecordAuditLogs(5);
                expect(ids.map((id: bigint) => Number(id))).to.deep.equal([1, 2, 3]);
            });

            it("keeps different records' logs isolated from one another", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a"); // logId 1 -> record 1
                await auditLog
                    .connect(accounts.other)
                    .createAudit(2, accounts.doctor.address, Action.CREATE_RECORD, "b"); // logId 2 -> record 2
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.UPDATE_RECORD, "c"); // logId 3 -> record 1

                const record1Logs = await auditLog.getRecordAuditLogs(1);
                const record2Logs = await auditLog.getRecordAuditLogs(2);

                expect(record1Logs.map((id: bigint) => Number(id))).to.deep.equal([1, 3]);
                expect(record2Logs.map((id: bigint) => Number(id))).to.deep.equal([2]);
            });
        });

        describe("totalAuditLogs", () => {
            it("returns 0 when no entries exist", async () => {
                expect(await auditLog.totalAuditLogs()).to.equal(0);
            });

            it("returns the correct count after several entries across different records", async () => {
                await configureWriter();
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "a");
                await auditLog
                    .connect(accounts.other)
                    .createAudit(2, accounts.doctor.address, Action.CREATE_RECORD, "b");
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.UPDATE_RECORD, "c");
                expect(await auditLog.totalAuditLogs()).to.equal(3);
            });
        });
    });

    // -----------------------------------------------------------------
    // 5. EDGE CASES
    // -----------------------------------------------------------------
    describe("Edge cases", () => {
        it("supports MedicalRecord rotation: old writer loses access, new writer gains it", async () => {
            await auditLog.setMedicalRecordContract(accounts.other.address);
            await auditLog
                .connect(accounts.other)
                .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "from A");

            await auditLog.setMedicalRecordContract(accounts.attacker.address);

            await expect(
                auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.UPDATE_RECORD, "from A again")
            ).to.be.revertedWithCustomError(auditLog, "Unauthorized");

            await expect(
                auditLog
                    .connect(accounts.attacker)
                    .createAudit(1, accounts.doctor.address, Action.UPDATE_RECORD, "from B")
            ).to.not.be.revert(ethers);

            expect(await auditLog.totalAuditLogs()).to.equal(2);
        });

        it("preserves logs written before a rotation after the writer changes", async () => {
            await auditLog.setMedicalRecordContract(accounts.other.address);
            await auditLog
                .connect(accounts.other)
                .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, "from A");

            await auditLog.setMedicalRecordContract(accounts.attacker.address);

            const entry = await auditLog.getAudit(1);
            expect(entry.performedBy).to.equal(accounts.doctor.address);
            expect(entry.details).to.equal("from A");
        });

        it("handles many logs across multiple records without cross-contamination", async () => {
            await configureWriter();

            for (let i = 0; i < 3; i++) {
                await auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.doctor.address, Action.CREATE_RECORD, `r1-${i}`);
            }
            for (let i = 0; i < 2; i++) {
                await auditLog
                    .connect(accounts.other)
                    .createAudit(2, accounts.hospital.address, Action.VIEW_RECORD, `r2-${i}`);
            }

            expect(await auditLog.totalAuditLogs()).to.equal(5);
            expect((await auditLog.getRecordAuditLogs(1)).length).to.equal(3);
            expect((await auditLog.getRecordAuditLogs(2)).length).to.equal(2);
        });

        it("assigns strictly sequential logIds regardless of which record they belong to", async () => {
            await configureWriter();
            await auditLog
                .connect(accounts.other)
                .createAudit(10, accounts.doctor.address, Action.CREATE_RECORD, "a");
            await auditLog
                .connect(accounts.other)
                .createAudit(20, accounts.hospital.address, Action.CREATE_RECORD, "b");
            await auditLog
                .connect(accounts.other)
                .createAudit(10, accounts.doctor.address, Action.UPDATE_RECORD, "c");

            const e1 = await auditLog.getAudit(1);
            const e2 = await auditLog.getAudit(2);
            const e3 = await auditLog.getAudit(3);
            expect(e1.recordId).to.equal(10);
            expect(e2.recordId).to.equal(20);
            expect(e3.recordId).to.equal(10);
        });

        it("a promoted admin (via AccessControl) can rotate the MedicalRecord address", async () => {
            // FIX: the previous version of this test never promoted
            // accounts.admin to Admin, so the call correctly reverted with
            // Unauthorized and the "not reverted" assertion failed. Only
            // accounts.owner is Admin by default (set in AccessControl's
            // constructor) — accounts.admin must be explicitly promoted first.
            await accessControl.assignRole(accounts.admin.address, Role.Admin);
            await expect(
                auditLog.connect(accounts.admin).setMedicalRecordContract(accounts.other.address)
            ).to.not.be.revert(ethers);
        });

        it("accepts an empty details string without reverting", async () => {
            await configureWriter();
            await expect(
                auditLog
                    .connect(accounts.other)
                    .createAudit(1, accounts.patient.address, Action.CREATE_RECORD, "")
            ).to.not.be.revert(ethers);
            const entry = await auditLog.getAudit(1);
            expect(entry.details).to.equal("");
        });
    });
});