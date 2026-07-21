import { JsonRpcProvider } from "ethers";
import { env } from "../../config/env";

export const provider = new JsonRpcProvider(
    env.ETHEREUM_RPC
);