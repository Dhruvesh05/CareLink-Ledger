import { IBlockchainProvider } from "./IBlockchainProvider";
import { BlockchainType } from "./BlockchainType";

import { EthereumProvider } from "../ethereum/EthereumProvider";

/*
|--------------------------------------------------------------------------
| Blockchain Factory
|--------------------------------------------------------------------------
|
| This class is responsible for selecting the correct blockchain provider.
| Services should NEVER instantiate EthereumProvider directly.
|
*/

export class BlockchainFactory {

public static getProvider(): IBlockchainProvider {

    const provider =
        process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();

        switch (provider) {

            case "ethereum":
            return new EthereumProvider();

            case "fabric":
            throw new Error("Fabric provider not implemented.");

            case "polygon":
            throw new Error("Polygon provider not implemented.");

            case "bridge":
            throw new Error("Bridge provider not implemented.");

            default:
            throw new Error(
                `Unsupported blockchain provider: ${provider}`
            );
        }
    } 
}