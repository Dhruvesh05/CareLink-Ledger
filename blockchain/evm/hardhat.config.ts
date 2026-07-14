import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

dotenv.config({ path: "../../.env" });
console.log("ETHERSCAN =", process.env.ETHERSCAN_API_KEY);

export default defineConfig({
  plugins: [
    hardhatToolboxMochaEthersPlugin,
    hardhatVerify
],

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },

    amoy: {
      type: "http",
      chainType: "l1",
      url: process.env.ALCHEMY_AMOY_URL || "",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },  
  },
  verify: {
        etherscan: {
            apiKey: process.env.ETHERSCAN_API_KEY || "",
        }
    }
});