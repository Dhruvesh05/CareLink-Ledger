import { Contract } from "ethers";

import { provider } from "./provider";
import { signer } from "./signer";

export function loadContract(
    address: string,
    abi: any
) {
    return new Contract(
        address,
        abi,
        signer
    );
}