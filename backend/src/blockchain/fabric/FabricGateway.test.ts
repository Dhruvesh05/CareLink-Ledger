import fs from "fs";
import crypto from "crypto";

jest.mock("@grpc/grpc-js", () => ({
    Client: jest.fn(() => ({})),
    credentials: {
        createSsl: jest.fn(() => ({})),
    },
}));

jest.mock("@hyperledger/fabric-gateway", () => ({
    connect: jest.fn(() => ({
        getNetwork: jest.fn(() => ({
            getContract: jest.fn(() => ({
                submitTransaction: jest.fn(),
                evaluateTransaction: jest.fn(),
            })),
        })),
        close: jest.fn(),
    })),

    signers: {
        newPrivateKeySigner: jest.fn(() => jest.fn()),
    },
}));

jest.mock("fs", () => ({
    readFileSync: jest.fn((filePath: string) => {
        if (String(filePath).includes("priv_sk")) {
            return "-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----";
        }

        return "test-certificate";
    }),
}));

jest.mock("crypto", () => ({
    ...jest.requireActual("crypto"),
    createPrivateKey: jest.fn(() => ({})),
}));

import { FabricGateway } from "./FabricGateway";

describe("FabricGateway", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = {
            ...originalEnv,

            FABRIC_CHANNEL: "carelinkchannel",
            FABRIC_CHAINCODE: "carelink",
            FABRIC_MSP: "CareLinkMSP",

            FABRIC_PEER_ENDPOINT:
                "localhost:7051",

            FABRIC_PEER_HOST_ALIAS:
                "peer0.carelink.com",

            FABRIC_TLS_CERT_PATH:
                "blockchain/fabric/network/organizations/peerOrganizations/carelink.com/peers/peer0.carelink.com/tls/ca.crt",

            FABRIC_CERT_PATH:
                "blockchain/fabric/network/organizations/peerOrganizations/carelink.com/users/Admin@carelink.com/msp/signcerts/Admin@carelink.com-cert.pem",

            FABRIC_KEY_PATH:
                "blockchain/fabric/network/organizations/peerOrganizations/carelink.com/users/Admin@carelink.com/msp/keystore/priv_sk",
        };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    it("connects and initializes the Fabric contract", () => {
        const gateway = new FabricGateway();

        expect(() =>
            gateway.connect()
        ).not.toThrow();

        const contract =
            gateway.getContract();

        expect(contract).toBeDefined();

        gateway.close();
    });

    it("does not reconnect when already connected", () => {
        const gateway = new FabricGateway();

        gateway.connect();

        const firstContract =
            gateway.getContract();

        gateway.connect();

        const secondContract =
            gateway.getContract();

        expect(secondContract)
            .toBe(firstContract);

        gateway.close();
    });

    it("throws when required Fabric configuration is missing", () => {
        delete process.env.FABRIC_CHANNEL;

        expect(() =>
            new FabricGateway()
        ).toThrow(
            "Missing Fabric configuration: FABRIC_CHANNEL"
        );
    });
});