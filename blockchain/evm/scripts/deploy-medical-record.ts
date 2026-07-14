// blockchain/evm/scripts/deploy-medical-record.ts

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
        MedicalRecord?: string;
        [key: string]: string | undefined;
    };
}

async function main(): Promise<void> {
    // Initialize environment 
    // @ts-ignore - custom project method
    const { ethers, networkName } = await network.create();
    const [deployer] = await ethers.getSigners();

    const chainId = (await ethers.provider.getNetwork()).chainId.toString();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log(`Network : ${networkName}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance : ${ethers.formatEther(balance)} ETH\n`);

    // =========================================================================
    // 1. READ & VALIDATE DEPLOYMENT JSON
    // =========================================================================
    const deploymentFile = path.join(
        process.cwd(),
        "deployments",
        `${networkName}.json`
    );

    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}. Ensure base contracts are deployed first.`);
    }

    const deployment: DeploymentRecord = JSON.parse(
        fs.readFileSync(deploymentFile, "utf8")
    );
    const deployedContracts = deployment.contracts;

    const requiredContracts = [
        "AccessControl",
        "PatientRegistry",
        "DoctorRegistry",
        "HospitalRegistry",
        "AuditLog"
    ];

    console.log("Loading existing contracts from deployment record...");
    for (const name of requiredContracts) {
        const address = deployedContracts[name];
        if (
            !address ||
            !ethers.isAddress(address) ||
            address === ethers.ZeroAddress
        ) {
            throw new Error(
                `Invalid address for ${name}: ${address}`
            );
        }
        console.log(`${name.padEnd(20)} -> ${address}`);
    }
    console.log();

    // Check if MedicalRecord is already deployed
    if (
        deployment.contracts.MedicalRecord &&
        deployment.contracts.MedicalRecord !== ethers.ZeroAddress
    ) {
        console.warn(`WARNING: MedicalRecord already exists at ${deployment.contracts.MedicalRecord}`);
        console.warn("A new MedicalRecord will be deployed and overwrite the deployment record.\n");
    }

    // =========================================================================
    // 2. ATTACH TO EXISTING REGISTRIES
    // =========================================================================
    const patientRegistry = await ethers.getContractAt(
        "PatientRegistry",
        deployedContracts.PatientRegistry
    );

    const auditLog = await ethers.getContractAt(
        "AuditLog",
        deployedContracts.AuditLog
    );

    // =========================================================================
    // 3. DEPLOY MEDICAL RECORD
    // =========================================================================
    console.log("Deploying MedicalRecord...");
    const medicalRecord = await ethers.deployContract("MedicalRecord", [
        deployedContracts.PatientRegistry,
        deployedContracts.DoctorRegistry,
        deployedContracts.HospitalRegistry,
        deployedContracts.AccessControl,
        deployedContracts.AuditLog
    ]);

    await medicalRecord.waitForDeployment();

    const medicalRecordAddress =
        await medicalRecord.getAddress();

    const deploymentTx =
        medicalRecord.deploymentTransaction();

    console.log("Deployment TX:");
    console.log(deploymentTx?.hash);
    
    // Verify deployment
    const code = await ethers.provider.getCode(medicalRecordAddress);
    if (code === "0x") {
        throw new Error("MedicalRecord deployment failed.");
    }
    
    console.log(`MedicalRecord deployed at: ${medicalRecordAddress}\n`);

    // =========================================================================
    // 4. LINK REGISTRIES
    // =========================================================================
    console.log("Setting MedicalRecord in PatientRegistry...");
    let tx = await patientRegistry.setMedicalRecordContract(medicalRecordAddress);
    console.log(`TX: ${tx.hash}`);
    await tx.wait();
    console.log("PatientRegistry successfully linked.\n");

    console.log("Setting MedicalRecord in AuditLog...");
    tx = await auditLog.setMedicalRecordContract(medicalRecordAddress);
    console.log(`TX: ${tx.hash}`);
    await tx.wait();
    console.log("AuditLog successfully linked.\n");

    // =========================================================================
    // 5. UPDATE DEPLOYMENT RECORD
    // =========================================================================
    deployment.contracts.MedicalRecord = medicalRecordAddress;
    deployment.timestamp = new Date().toISOString();

    fs.writeFileSync(
        deploymentFile,
        JSON.stringify(deployment, null, 2) + "\n",
        "utf8"
    );
    console.log(`Deployment record successfully updated in ${deploymentFile}\n`);

    // =========================================================================
    // 6. SUCCESS SUMMARY
    // =========================================================================
    console.log("==========================================");
    console.log("CareLink Ledger Deployment Summary");
    console.log("==========================================");
    console.log(`AccessControl     : ${deployment.contracts.AccessControl}`);
    console.log(`PatientRegistry   : ${deployment.contracts.PatientRegistry}`);
    console.log(`DoctorRegistry    : ${deployment.contracts.DoctorRegistry}`);
    console.log(`HospitalRegistry  : ${deployment.contracts.HospitalRegistry}`);
    console.log(`AuditLog          : ${deployment.contracts.AuditLog}`);
    console.log(`MedicalRecord     : ${medicalRecordAddress}`);
    console.log("==========================================");
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});