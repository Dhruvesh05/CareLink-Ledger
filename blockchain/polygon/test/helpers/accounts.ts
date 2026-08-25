import type { HardhatEthers } from "hardhat/types";

export interface TestAccounts {
    owner: any;
    admin: any;
    patient: any;
    doctor: any;
    hospital: any;
    attacker: any;
    other: any;
}

/**
 * Returns named test accounts using the existing Hardhat connection.
 */
export async function getTestAccounts(
    ethers: HardhatEthers
): Promise<TestAccounts> {
    const signers = await ethers.getSigners();

    return {
        owner: signers[0],
        admin: signers[1],
        patient: signers[2],
        doctor: signers[3],
        hospital: signers[4],
        attacker: signers[5],
        other: signers[6],
    };
}