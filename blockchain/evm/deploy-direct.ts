import "dotenv/config";
import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.ETHEREUM_RPC!
  );

  const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY!,
    provider
  );

  const statePath =
    "blockchain/evm/direct-sepolia-deployment.json";

  const state: any = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : {};

  const artifact = (name: string) =>
    JSON.parse(
      readFileSync(
        `blockchain/evm/artifacts/contracts/${name}.sol/${name}.json`,
        "utf8"
      )
    );

  const gasPrice =
    (await provider.getFeeData()).gasPrice ??
    ethers.parseUnits("2", "gwei");

  console.log("wallet:", signer.address);
  console.log(
    "balance:",
    ethers.formatEther(
      await provider.getBalance(signer.address)
    ),
    "ETH"
  );
  console.log(
    "gasPrice:",
    ethers.formatUnits(gasPrice, "gwei"),
    "gwei"
  );

  async function deploy(
    name: string,
    args: any[] = []
  ) {
    if (state[name]) {
      console.log(
        `${name}: existing ${state[name]}`
      );
      return state[name];
    }

    const a = artifact(name);

    const factory = new ethers.ContractFactory(
      a.abi,
      a.bytecode,
      signer
    );

    console.log(`\nDeploying ${name}...`);

    const tx = await factory.getDeployTransaction(
      ...args
    );

    const gas =
      await provider.estimateGas({
        from: signer.address,
        data: tx.data
      });

    console.log(
      `${name} gas:`,
      gas.toString(),
      "cost:",
      ethers.formatEther(gas * gasPrice),
      "ETH"
    );

    const sent = await signer.sendTransaction({
      data: tx.data,
      gasLimit: gas,
      gasPrice
    });

    console.log(`${name} tx:`, sent.hash);

    const receipt = await sent.wait();

    if (!receipt?.contractAddress)
      throw new Error(`${name} address missing`);

    state[name] = receipt.contractAddress;

    writeFileSync(
      statePath,
      JSON.stringify(state, null, 2)
    );

    console.log(
      `${name}:`,
      receipt.contractAddress
    );

    return receipt.contractAddress;
  }

  const accessControl =
    await deploy("AccessControl");

  const patientRegistry =
    await deploy(
      "PatientRegistry",
      [accessControl]
    );

  const doctorRegistry =
    await deploy(
      "DoctorRegistry",
      [accessControl]
    );

  const hospitalRegistry =
    await deploy(
      "HospitalRegistry",
      [accessControl]
    );

  const auditLog =
    await deploy(
      "AuditLog",
      [accessControl]
    );

  const medicalRecord =
    await deploy(
      "MedicalRecord",
      [
        patientRegistry,
        doctorRegistry,
        hospitalRegistry,
        accessControl,
        auditLog
      ]
    );

  console.log(
    "\n========== WIRING =========="
  );

  const access = new ethers.Contract(
    accessControl,
    artifact("AccessControl").abi,
    signer
  );

  const patient = new ethers.Contract(
    patientRegistry,
    artifact("PatientRegistry").abi,
    signer
  );

  const audit = new ethers.Contract(
    auditLog,
    artifact("AuditLog").abi,
    signer
  );

  const doctor =
    "0xC8245E149A63A6605CFdC05425073A532dB8e3a5";

  if (!(await access.isBridgeExecutor(signer.address))) {
    await (
      await access.setBridgeExecutor(
        signer.address,
        true,
        { gasPrice }
      )
    ).wait();
    console.log("BridgeExecutor enabled");
  }

  if (!(await access.isDoctor(doctor))) {
    await (
      await access.assignRole(
        doctor,
        2,
        { gasPrice }
      )
    ).wait();
    console.log("Doctor role enabled");
  }

  await (
    await patient.setMedicalRecordContract(
      medicalRecord,
      { gasPrice }
    )
  ).wait();

  console.log("PatientRegistry wired");

  await (
    await audit.setMedicalRecordContract(
      medicalRecord,
      { gasPrice }
    )
  ).wait();

  console.log("AuditLog wired");

  console.log(
    "\n========== ETHEREUM READY =========="
  );

  for (const [k, v] of Object.entries(state))
    console.log(`${k}: ${v}`);

  console.log(
    "MedicalRecord:",
    medicalRecord
  );

  console.log(
    "balance:",
    ethers.formatEther(
      await provider.getBalance(signer.address)
    ),
    "ETH"
  );
}

main().catch((e) => {
  console.error(
    "\nFAILED:",
    e?.shortMessage ??
    e?.reason ??
    e?.message ??
    e
  );
  process.exitCode = 1;
});
