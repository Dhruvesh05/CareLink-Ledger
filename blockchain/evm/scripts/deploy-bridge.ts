// scripts/deploy-bridge.ts
//
// Dedicated deployment for the bridge-enabled CareLink Ledger contracts.
// Does NOT modify or replace the existing deploy.ts.
//
// Run:
//   npx hardhat run scripts/deploy-bridge.ts --build-profile production --network sepolia
//   npx hardhat run scripts/deploy-bridge.ts --build-profile production --network amoy

import { network } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

interface DeploymentRecord {
  network: string;
  chainId: string;
  deployer: string;
  timestamp: string;
  bridgeExecutor: string;
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

  console.log("\n========================================");
  console.log("CareLink Ledger Bridge Deployment");
  console.log("========================================");
  console.log(`Network       : ${networkName}`);
  console.log(`Chain ID      : ${chainId}`);
  console.log(`Deployer      : ${deployer.address}`);
  console.log(`BridgeExecutor: ${deployer.address}`);
  console.log("========================================\n");

  // ---------------------------------------------------------------
  // 1. AccessControl
  // ---------------------------------------------------------------
  console.log("1. Using existing AccessControl...");

  const accessControlAddress =
    "0xff98Dc04De3Ef7f611ca7654Fb00138d1B86De60";

  const accessControl = await ethers.getContractAt(
    "AccessControl",
    accessControlAddress
  );

  console.log(`   AccessControl -> ${accessControlAddress}`);

  // ---------------------------------------------------------------
  // 2. Registries
  // ---------------------------------------------------------------
  console.log("\n2. Deploying registries...");

  const patientRegistry = await ethers.deployContract(
    "PatientRegistry",
    [accessControlAddress],
    { gasLimit: 1700000 }
  );
  await patientRegistry.waitForDeployment();

  const patientRegistryAddress = await patientRegistry.getAddress();
  console.log(`   PatientRegistry -> ${patientRegistryAddress}`);

  const doctorRegistry = await ethers.deployContract(
    "DoctorRegistry",
    [accessControlAddress],
    { gasLimit: 2000000 }
  );
  await doctorRegistry.waitForDeployment();

  const doctorRegistryAddress = await doctorRegistry.getAddress();
  console.log(`   DoctorRegistry  -> ${doctorRegistryAddress}`);

  const hospitalRegistry = await ethers.deployContract(
    "HospitalRegistry",
    [accessControlAddress],
    { gasLimit: 1700000 }
  );
  await hospitalRegistry.waitForDeployment();

  const hospitalRegistryAddress = await hospitalRegistry.getAddress();
  console.log(`   HospitalRegistry -> ${hospitalRegistryAddress}`);

  // ---------------------------------------------------------------
  // 3. AuditLog
  // ---------------------------------------------------------------
  console.log("\n3. Deploying AuditLog...");

  const auditLog = await ethers.deployContract(
    "AuditLog",
    [accessControlAddress]
  );
  await auditLog.waitForDeployment();

  const auditLogAddress = await auditLog.getAddress();
  console.log(`   AuditLog -> ${auditLogAddress}`);

  // ---------------------------------------------------------------
  // 4. MedicalRecord
  // ---------------------------------------------------------------
  console.log("\n4. Deploying MedicalRecord...");

  const medicalRecord = await ethers.deployContract("MedicalRecord", [
    patientRegistryAddress,
    doctorRegistryAddress,
    hospitalRegistryAddress,
    accessControlAddress,
    auditLogAddress,
  ]);

  await medicalRecord.waitForDeployment();

  const medicalRecordAddress = await medicalRecord.getAddress();
  console.log(`   MedicalRecord -> ${medicalRecordAddress}`);

  // ---------------------------------------------------------------
  // 5. Wire dependent contracts
  // ---------------------------------------------------------------
  console.log("\n5. Wiring dependent contracts...");

  let tx = await patientRegistry.setMedicalRecordContract(
    medicalRecordAddress
  );
  await tx.wait();
  console.log("   PatientRegistry -> MedicalRecord: confirmed");

  tx = await auditLog.setMedicalRecordContract(medicalRecordAddress);
  await tx.wait();
  console.log("   AuditLog -> MedicalRecord: confirmed");

  // ---------------------------------------------------------------
  // 6. Authorize bridge executor
  // ---------------------------------------------------------------
  console.log("\n6. Authorizing bridge executor...");

  tx = await accessControl.setBridgeExecutor(
    deployer.address,
    true
  );
  await tx.wait();

  const bridgeAuthorized =
    await accessControl.isBridgeExecutor(deployer.address);

  if (!bridgeAuthorized) {
    throw new Error(
      "Bridge executor authorization verification failed"
    );
  }

  console.log(
    `   ${deployer.address} -> BridgeExecutor: authorized`
  );

  // ---------------------------------------------------------------
  // 7. Persist deployment
  // ---------------------------------------------------------------
  const deployment: DeploymentRecord = {
    network: networkName,
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    bridgeExecutor: deployer.address,
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

  const outFile = path.join(
    deploymentsDir,
    `bridge-${networkName}.json`
  );

  fs.writeFileSync(
    outFile,
    JSON.stringify(deployment, null, 2) + "\n",
    "utf8"
  );

  console.log("\n========================================");
  console.log("Bridge deployment complete");
  console.log("========================================");
  console.log(`Saved to: ${path.relative(process.cwd(), outFile)}`);
  console.log("\n" + JSON.stringify(deployment, null, 2));
}

main().catch((error: unknown) => {
  console.error("\nDeployment failed:");
  console.error(error);
  process.exitCode = 1;
});
