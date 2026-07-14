import { network } from "hardhat";

async function main() {
    const { ethers } = await network.create();

    const contract = await ethers.getContractAt(
        "MedicalRecord",
        "0xEd76D2d27262bdB86f37e4191945c55E719ddf40"
    );

    console.log("Total Records:");
    console.log(await contract.totalRecords());

    const code = await ethers.provider.getCode(
        "0xEd76D2d27262bdB86f37e4191945c55E719ddf40"
    );

    console.log("\nBytecode length:");
    console.log(code.length);

    console.log("\nFirst bytes:");
    console.log(code.substring(0, 40));
}

main().catch(console.error);