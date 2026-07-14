// scripts/deploy.ts
//
// Hardhat 3 / TypeScript / ESM deployment script for CareLink Ledger.
//
// Run with:
//   npx hardhat run scripts/deploy.ts --build-profile production --network sepolia
//   npx hardhat run scripts/deploy.ts --build-profile production --network amoy
//   npx hardhat run scripts/deploy.ts --network hardhatMainnet          (local simulated network)
//
// --build-profile production turns on the optimizer settings from
// hardhat.config.ts and uses Isolated Builds, so this is the profile you
// want for anything other than local iteration.
//
// DEPLOYMENT ORDER — do not reorder this:
//   1. AccessControl        (every other contract depends on it for auth)
//   2. PatientRegistry, DoctorRegistry, HospitalRegistry (each only needs AccessControl)
//   3. AuditLog              (needs AccessControl; its authorized writer is wired in at step 5)
//   4. MedicalRecord         (needs all five addresses above)
//   5. Link PatientRegistry -> MedicalRecord, AuditLog -> MedicalRecord
//
// Until step 5 completes, MedicalRecord.createMedicalRecord /
// updateMedicalRecord / deactivateMedicalRecord will revert: the patient
// record-count increment and the audit log write are both gated to the
// MedicalRecord address specifically, and neither registry knows that
// address until you tell it.

import { network } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

interface DeploymentRecord {
  network: string;
  chainId: string;
  deployer: string;
  timestamp: string;
  contracts: {
    AccessControl: string;
    PatientRegistry: string;
    DoctorRegistry: string;
    HospitalRegistry: string;
    AuditLog: string;
    MedicalRecord: string;
  };
}

async function main(): Promise<void> {
  const { ethers, networkName } = await network.create();
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  console.log(`\nDeploying CareLink Ledger`);
  console.log(`  network : ${networkName} (chainId ${chainId})`);
  console.log(`  deployer: ${deployer.address}\n`);

  // ---------------------------------------------------------------------
  // 1. AccessControl
  // ---------------------------------------------------------------------
  const accessControl = await ethers.deployContract("AccessControl");
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log(`AccessControl     -> ${accessControlAddress}`);

  // ---------------------------------------------------------------------
  // 2. Registries
  // ---------------------------------------------------------------------
  const patientRegistry = await ethers.deployContract("PatientRegistry", [accessControlAddress]);
  await patientRegistry.waitForDeployment();
  const patientRegistryAddress = await patientRegistry.getAddress();
  console.log(`PatientRegistry   -> ${patientRegistryAddress}`);

  const doctorRegistry = await ethers.deployContract("DoctorRegistry", [accessControlAddress]);
  await doctorRegistry.waitForDeployment();
  const doctorRegistryAddress = await doctorRegistry.getAddress();
  console.log(`DoctorRegistry    -> ${doctorRegistryAddress}`);

  const hospitalRegistry = await ethers.deployContract("HospitalRegistry", [accessControlAddress]);
  await hospitalRegistry.waitForDeployment();
  const hospitalRegistryAddress = await hospitalRegistry.getAddress();
  console.log(`HospitalRegistry  -> ${hospitalRegistryAddress}`);

  // ---------------------------------------------------------------------
  // 3. AuditLog
  // ---------------------------------------------------------------------
  const auditLog = await ethers.deployContract("AuditLog", [accessControlAddress]);
  await auditLog.waitForDeployment();
  const auditLogAddress = await auditLog.getAddress();
  console.log(`AuditLog          -> ${auditLogAddress}`);

  // ---------------------------------------------------------------------
  // 4. MedicalRecord
  // ---------------------------------------------------------------------
  const medicalRecord = await ethers.deployContract("MedicalRecord", [
    patientRegistryAddress,
    doctorRegistryAddress,
    hospitalRegistryAddress,
    accessControlAddress,
    auditLogAddress,
  ]);
  await medicalRecord.waitForDeployment();
  const medicalRecordAddress = await medicalRecord.getAddress();
  console.log(`MedicalRecord     -> ${medicalRecordAddress}`);

  // ---------------------------------------------------------------------
  // 5. Wire the write-authorization links
  // ---------------------------------------------------------------------
  console.log(`\nLinking dependent contracts to MedicalRecord...`);

  let tx = await patientRegistry.setMedicalRecordContract(medicalRecordAddress);
  await tx.wait();
  console.log(`  PatientRegistry.setMedicalRecordContract(...) confirmed`);

  tx = await auditLog.setMedicalRecordContract(medicalRecordAddress);
  await tx.wait();
  console.log(`  AuditLog.setMedicalRecordContract(...) confirmed`);

  // ---------------------------------------------------------------------
  // 6. Persist addresses for Spring Boot / React / other consumers
  // ---------------------------------------------------------------------
  const deployment: DeploymentRecord = {
    network: networkName,
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AccessControl: accessControlAddress,
      PatientRegistry: patientRegistryAddress,
      DoctorRegistry: doctorRegistryAddress,
      HospitalRegistry: hospitalRegistryAddress,
      AuditLog: auditLogAddress,
      MedicalRecord: medicalRecordAddress,
    },
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const outFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2) + "\n", "utf8");

  console.log(`\nDeployment complete. Addresses written to ${path.relative(process.cwd(), outFile)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});