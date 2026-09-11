import {
    CrossChainMessage
} from "../crosschain/CrossChainMessage";

import {
    BlockchainType
} from "../provider/BlockchainType";

import {
    IBlockchainProvider
} from "../provider/IBlockchainProvider";

import {
    CrossChainAuditService
} from "../../services/CrossChainAuditService";

export interface RelayResult {
    messageId: string;
    sourceChain: BlockchainType;
    destinationChain: BlockchainType;
    status:
        | "accepted"
        | "duplicate"
        | "confirmed"
        | "failed"
        | "ignored";
    destinationTransactionHash?: string;
}

type RelayableEvent =
    | "PatientReactivated"
    | "DoctorVerified"
    | "DoctorVerificationRevoked"
    | "DoctorReactivated"
    | "HospitalVerified"
    | "HospitalVerificationRevoked"
    | "HospitalReactivated";

const RELAYABLE_EVENTS =
    new Set<RelayableEvent>([
        "PatientReactivated",
        "DoctorVerified",
        "DoctorVerificationRevoked",
        "DoctorReactivated",
        "HospitalVerified",
        "HospitalVerificationRevoked",
        "HospitalReactivated"
    ]);

function extractTransactionHash(
    result: any
): string | undefined {

    return (
        result?.hash ??
        result?.transactionHash
    );
}

function extractWallet(
    message: CrossChainMessage
): string {

    const payload =
        message.payload as {
            args?: unknown[];
        };

    const wallet =
        payload.args?.[0];

    if (
        typeof wallet !== "string" ||
        !wallet.trim()
    ) {
        throw new Error(
            "Relayable event does not contain a wallet argument"
        );
    }

    return wallet;
}

function extractEventName(
    message: CrossChainMessage
): string {

    const payload =
        message.payload as {
            eventName?: unknown;
        };

    if (
        typeof payload.eventName !== "string"
    ) {
        throw new Error(
            "Cross-chain message does not contain eventName"
        );
    }

    return payload.eventName;
}

export class BridgeService {

    private readonly providers:
        Partial<Record<
            BlockchainType,
            IBlockchainProvider
        >>;

    constructor(
        private readonly auditService =
            new CrossChainAuditService(),
        providers?: Partial<Record<
            BlockchainType,
            IBlockchainProvider
        >>
    ) {

        this.providers = providers ?? {};
    }

    async isKnownDestinationTransaction(
        transactionHash: string
    ): Promise<boolean> {
        return await this.auditService.isKnownDestinationTransaction(
            transactionHash
        );
    }

    async relay<T>(
        message: CrossChainMessage<T>
    ): Promise<RelayResult> {

        if (
            message.sourceChain ===
            message.destinationChain
        ) {
            throw new Error(
                "Source and destination chains must be different"
            );
        }

        if (
            message.destinationChain ===
            BlockchainType.BRIDGE
        ) {
            throw new Error(
                "Bridge cannot be used as a destination chain"
            );
        }

        const status =
            await this.auditService.recordAccepted(
                message
            );

        if (status === "duplicate") {
            return {
                messageId: message.messageId,
                sourceChain:
                    message.sourceChain,
                destinationChain:
                    message.destinationChain,
                status: "duplicate"
            };
        }

        const eventName =
            extractEventName(message);

        if (
            !RELAYABLE_EVENTS.has(
                eventName as RelayableEvent
            )
        ) {

            return {
                messageId: message.messageId,
                sourceChain:
                    message.sourceChain,
                destinationChain:
                    message.destinationChain,
                status: "ignored"
            };
        }

        let destinationProvider =
            this.providers[
                message.destinationChain
            ];

        if (!destinationProvider) {
            switch (message.destinationChain) {
                case BlockchainType.ETHEREUM: {
                    const { EthereumProvider } =
                        require("../ethereum/provider/EthereumProvider");

                    destinationProvider =
                        new EthereumProvider();
                    break;
                }

                case BlockchainType.POLYGON: {
                    const { PolygonProvider } =
                        require("../polygon/provider/PolygonProvider");

                    destinationProvider =
                        new PolygonProvider();
                    break;
                }

                default:
                    break;
            }
        }

        if (!destinationProvider) {
            await this.auditService.markFailed(
                message.messageId,
                `No provider configured for ${message.destinationChain}`
            );

            return {
                messageId: message.messageId,
                sourceChain:
                    message.sourceChain,
                destinationChain:
                    message.destinationChain,
                status: "failed"
            };
        }

        try {

            await this.auditService.markRelaying(
                message.messageId
            );

            const wallet =
                extractWallet(message);

            let result: any;

            switch (eventName as RelayableEvent) {

                case "PatientReactivated":
                    result =
                        await destinationProvider
                            .reactivatePatient(wallet);
                    break;

                case "DoctorVerified":
                    result =
                        await destinationProvider
                            .verifyDoctor(wallet);
                    break;

                case "DoctorVerificationRevoked":
                    result =
                        await destinationProvider
                            .revokeDoctorVerification(wallet);
                    break;

                case "DoctorReactivated":
                    result =
                        await destinationProvider
                            .reactivateDoctor(wallet);
                    break;

                case "HospitalVerified":
                    result =
                        await destinationProvider
                            .verifyHospital(wallet);
                    break;

                case "HospitalVerificationRevoked":
                    result =
                        await destinationProvider
                            .revokeHospitalVerification(wallet);
                    break;

                case "HospitalReactivated":
                    result =
                        await destinationProvider
                            .reactivateHospital(wallet);
                    break;
            }

            const destinationTransactionHash =
                extractTransactionHash(result);

            if (!destinationTransactionHash) {
                throw new Error(
                    "Destination transaction completed without a transaction hash"
                );
            }

            await this.auditService.markConfirmed(
                message.messageId,
                destinationTransactionHash
            );

            return {
                messageId: message.messageId,
                sourceChain:
                    message.sourceChain,
                destinationChain:
                    message.destinationChain,
                status: "confirmed",
                destinationTransactionHash
            };

        } catch (error: any) {

            const errorMessage =
                error?.shortMessage ??
                error?.reason ??
                error?.message ??
                String(error);

            await this.auditService.markFailed(
                message.messageId,
                errorMessage
            );

            return {
                messageId: message.messageId,
                sourceChain:
                    message.sourceChain,
                destinationChain:
                    message.destinationChain,
                status: "failed"
            };
        }
    }
}
