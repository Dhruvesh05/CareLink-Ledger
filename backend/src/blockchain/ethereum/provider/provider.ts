import { ethers } from "ethers";

export const provider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC
);

export const signer = new ethers.Wallet(
  process.env.PRIVATE_KEY!,
  provider
);