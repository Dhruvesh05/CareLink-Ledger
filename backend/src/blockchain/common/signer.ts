import { Wallet } from "ethers";

import { provider } from "./provider";

import { env } from "../../config/env";

export const signer = new Wallet(
    env.PRIVATE_KEY,
    provider
);