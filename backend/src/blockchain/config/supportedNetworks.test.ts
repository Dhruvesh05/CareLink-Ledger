import { describe, expect, it } from "@jest/globals";
import { getSupportedEvmNetwork } from "./supportedNetworks";

describe("supported CareLink EVM networks", () => {
    it("resolves Ethereum Sepolia to the configured Ethereum contracts", () => {
        const network = getSupportedEvmNetwork(11155111);
        expect(network.provider).toBe("ethereum");
        expect(network.name).toBe("Ethereum Sepolia");
        expect(network.chainId).toBe(11155111);
        expect(network.medicalRecordAddress).toBe(process.env.MEDICAL_RECORD_ADDRESS);
    });

    it("resolves Polygon Amoy to the configured Polygon contracts", () => {
        const network = getSupportedEvmNetwork(80002);
        expect(network.provider).toBe("polygon");
        expect(network.name).toBe("Polygon Amoy");
        expect(network.chainId).toBe(80002);
        expect(network.medicalRecordAddress).toBe(process.env.POLYGON_MEDICAL_RECORD_ADDRESS);
    });

    it("rejects mainnet and unknown chain IDs instead of silently using an EVM default", () => {
        expect(() => getSupportedEvmNetwork(1)).toThrow(/Unsupported blockchain chain ID/);
        expect(() => getSupportedEvmNetwork(137)).toThrow(/Unsupported blockchain chain ID/);
    });
});
