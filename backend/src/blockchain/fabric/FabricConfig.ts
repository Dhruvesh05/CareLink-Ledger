import path from "path";

export interface FabricConfig {
    channel: string;
    chaincode: string;
    mspId: string;
    peerEndpoint: string;
    peerHostAlias: string;
    tlsCertPath: string;
    certPath: string;
    keyPath: string;
}

export function getFabricConfig(): FabricConfig {
    const required = (name: string, value: string | undefined): string => {
        if (!value) {
            throw new Error(`Missing Fabric configuration: ${name}`);
        }
        return value;
    };

    return {
        channel: required("FABRIC_CHANNEL", process.env.FABRIC_CHANNEL),
        chaincode: required("FABRIC_CHAINCODE", process.env.FABRIC_CHAINCODE),
        mspId: required("FABRIC_MSP", process.env.FABRIC_MSP),

        peerEndpoint: required(
            "FABRIC_PEER_ENDPOINT",
            process.env.FABRIC_PEER_ENDPOINT
        ),

        peerHostAlias: required(
            "FABRIC_PEER_HOST_ALIAS",
            process.env.FABRIC_PEER_HOST_ALIAS
        ),

        tlsCertPath: path.resolve(
            process.cwd(),
            "..",
            required(
                "FABRIC_TLS_CERT_PATH",
                process.env.FABRIC_TLS_CERT_PATH
            )
        ),

        certPath: path.resolve(
            process.cwd(),
            "..",
            required(
                "FABRIC_CERT_PATH",
                process.env.FABRIC_CERT_PATH
            )
        ),

        keyPath: path.resolve(
            process.cwd(),
            "..",
            required(
                "FABRIC_KEY_PATH",
                process.env.FABRIC_KEY_PATH
            )
        ),
    };
}
