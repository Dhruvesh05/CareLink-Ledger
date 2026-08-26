import { IBlockchainProvider } from "./IBlockchainProvider";

/*
|--------------------------------------------------------------------------
| Blockchain Factory
|--------------------------------------------------------------------------
|
| Selects the blockchain provider configured for the application.
|
| IMPORTANT:
| Provider implementations are loaded lazily.
| This prevents importing Ethereum configuration during controller/test
| module initialization when Ethereum is not actually being used.
|
*/

export class BlockchainFactory {

    public static getProvider(): IBlockchainProvider {

        const provider =
            process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();

        switch (provider) {

            case "ethereum": {
                const { EthereumProvider } =
                    require("../ethereum/provider/EthereumProvider");

                return new EthereumProvider();
            }

            case "fabric": {
                const { FabricProvider } =
                    require("../fabric/provider/FabricProvider");

                return new FabricProvider();
            }

            case "polygon":
                throw new Error(
                    "Polygon provider not implemented."
                );

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
