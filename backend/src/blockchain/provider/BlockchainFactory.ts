import { IBlockchainProvider } from "./IBlockchainProvider";
import { createRequire } from "node:module";

const runtimeRequire =
    typeof require === "function"
        ? require
        : createRequire(process.cwd());

/*
|--------------------------------------------------------------------------
| Blockchain Factory
|--------------------------------------------------------------------------
|
| Selects the blockchain provider configured for the application.
|
| Provider implementations are loaded lazily using a runtime require.
| This prevents unnecessary blockchain configuration from being loaded
| during application/test initialization.
|
*/

export class BlockchainFactory {

    public static getProvider(): IBlockchainProvider {

        const provider =
            process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();

        switch (provider) {

            case "ethereum": {
                const { EthereumProvider } =
                    runtimeRequire("../ethereum/provider/EthereumProvider");

                return new EthereumProvider();
            }

            case "polygon": {
                const { PolygonProvider } =
                    runtimeRequire("../polygon/provider/PolygonProvider");

                return new PolygonProvider();
            }

            case "fabric": {
                const { FabricProvider } =
                    runtimeRequire("../fabric/provider/FabricProvider");

                return new FabricProvider();
            }

            case "bridge":
                throw new Error(
                    "Bridge provider not implemented."
                );

            default:
                throw new Error(
                    `Unsupported blockchain provider: ${provider}`
                );
        }
    }
}
