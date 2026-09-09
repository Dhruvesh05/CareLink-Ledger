import fs from "fs";
import crypto from "crypto";

import * as grpc from "@grpc/grpc-js";
import {
    connect,
    Contract,
    Gateway,
    signers,
} from "@hyperledger/fabric-gateway";

import {
    FabricConfig,
    getFabricConfig,
} from "./FabricConfig";

export class FabricGateway {
    private readonly config: FabricConfig;

    private gateway?: Gateway;

    private contract?: Contract;

    constructor() {
        this.config = getFabricConfig();
    }

    connect(): void {
        if (this.gateway && this.contract) {
            return;
        }

        const tlsCertificate = fs.readFileSync(
            this.config.tlsCertPath
        );

        const client = new grpc.Client(
            this.config.peerEndpoint,
            grpc.credentials.createSsl(
                tlsCertificate
            ),
            {
                "grpc.ssl_target_name_override":
                    this.config.peerHostAlias,

                "grpc.default_authority":
                    this.config.peerHostAlias,
            }
        );

        const certificate = fs.readFileSync(
            this.config.certPath,
            "utf8"
        );

        const privateKeyPem = fs.readFileSync(
            this.config.keyPath,
            "utf8"
        );

        const privateKey = crypto.createPrivateKey(
            privateKeyPem
        );

        const identity = {
            mspId: this.config.mspId,
            credentials: Buffer.from(
                certificate
            ),
        };

        const signer =
            signers.newPrivateKeySigner(
                privateKey
            );

        this.gateway = connect({
            client,
            identity,
            signer,
        });

        this.contract = this.gateway
            .getNetwork(this.config.channel)
            .getContract(
                this.config.chaincode
            );
    }

    getContract(): Contract {
        if (!this.contract) {
            this.connect();
        }

        if (!this.contract) {
            throw new Error(
                "Fabric contract is not initialized"
            );
        }

        return this.contract;
    }

    close(): void {
        if (this.gateway) {
            this.gateway.close();
        }

        this.gateway = undefined;

        this.contract = undefined;
    }
}