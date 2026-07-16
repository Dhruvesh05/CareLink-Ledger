import hre from "hardhat";

async function main() {
  const patientRegistry = await hre.ethers.getContractAt(
    "PatientRegistry",
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  );

  const auditLog = await hre.ethers.getContractAt(
    "AuditLog",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  );

  const medicalRecordAddress =
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

  console.log("Setting MedicalRecord in PatientRegistry...");
  await (await patientRegistry.setMedicalRecordContract(medicalRecordAddress)).wait();

  console.log("Setting MedicalRecord in AuditLog...");
  await (await auditLog.setMedicalRecordContract(medicalRecordAddress)).wait();

  console.log("✅ Setup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});