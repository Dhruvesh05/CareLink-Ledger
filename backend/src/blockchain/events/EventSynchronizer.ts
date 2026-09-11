import { ethers } from "ethers";

import {
    CrossChainMessage,
    createCrossChainMessage,
} from "../crosschain/CrossChainMessage";
import { BridgeService } from "../bridge/BridgeService";
import { BlockchainType } from "../provider/BlockchainType";

export interface EventSynchronizerContract {
    on(
        eventName: string,
        listener: (...args: any[]) => void
    ): Promise<unknown> | unknown;

    off?(
        eventName: string,
        listener: (...args: any[]) => void
    ): Promise<unknown> | unknown;
}

export interface EventSynchronizerConfig {
    sourceChain: BlockchainType;
    destinationChain: BlockchainType;
    contracts: Record<string, EventSynchronizerContract>;
    bridge: BridgeService;
}

export interface SynchronizedEvent {
    contract: string;
    eventName: string;
    message: CrossChainMessage;
}

const EVENTS_BY_CONTRACT: Record<string, string[]> = {
    accessControl: [
        "RoleAssigned",
        "RoleUpdated",
        "RoleRevoked",
    ],

    patientRegistry: [
        "PatientRegistered",
        "BloodGroupUpdated",
        "PatientDeactivated",
        "PatientReactivated",
        "RecordCountIncremented",
    ],

    doctorRegistry: [
        "DoctorRegistered",
        "DoctorVerified",
        "DoctorVerificationRevoked",
        "DoctorUpdated",
        "DoctorDeactivated",
        "DoctorReactivated",
    ],

    hospitalRegistry: [
        "HospitalRegistered",
        "HospitalVerified",
        "HospitalVerificationRevoked",
        "HospitalUpdated",
        "HospitalDeactivated",
        "HospitalReactivated",
    ],

    medicalRecord: [
        "RecordCreated",
        "EmergencyRecordCreated",
        "RecordUpdated",
        "MetadataUpdated",
        "RecordDeactivated",
        "AccessGranted",
        "AccessRevoked",
    ],

    auditLog: [
        "AuditRecorded",
    ],
};

function serializeArgument(value: unknown): unknown {
    if (typeof value === "bigint") {
        return value.toString();
    }

    if (Array.isArray(value)) {
        return value.map(serializeArgument);
    }

    return value;
}

function buildEventPayload(
    contract: string,
    eventName: string,
    args: unknown[]
) {
    return {
        contract,
        eventName,
        args: args.map(serializeArgument),
    };
}

export class EventSynchronizer {
    private readonly sourceChain: BlockchainType;
    private readonly destinationChain: BlockchainType;
    private readonly contracts: Record<string, EventSynchronizerContract>;
    private readonly bridge: BridgeService;

    private readonly listeners = new Map<
        string,
        (...args: any[]) => void
    >();

    constructor(config: EventSynchronizerConfig) {
        if (
            config.sourceChain === config.destinationChain
        ) {
            throw new Error(
                "Source and destination chains must be different"
            );
        }

        if (
            config.destinationChain === BlockchainType.BRIDGE
        ) {
            throw new Error(
                "Bridge cannot be used as a destination chain"
            );
        }

        this.sourceChain = config.sourceChain;
        this.destinationChain = config.destinationChain;
        this.contracts = config.contracts;
        this.bridge = config.bridge;
    }

    start(): void {
        for (const [contractName, contract] of Object.entries(
            this.contracts
        )) {
            const eventNames =
                EVENTS_BY_CONTRACT[contractName] ?? [];

            for (const eventName of eventNames) {
                const key = `${contractName}:${eventName}`;

                if (this.listeners.has(key)) {
                    continue;
                }

                const listener = async (...args: any[]) => {
                    await this.handleEvent(
                        contractName,
                        eventName,
                        args
                    );
                };

                contract.on(eventName, listener);

                this.listeners.set(key, listener);
            }
        }
    }

    async stop(): Promise<void> {
        for (const [
            key,
            listener,
        ] of this.listeners.entries()) {
            const separator = key.indexOf(":");

            const contractName =
                key.slice(0, separator);

            const eventName =
                key.slice(separator + 1);

            const contract =
                this.contracts[contractName];

            if (contract?.off) {
                await contract.off(
                    eventName,
                    listener
                );
            }
        }

        this.listeners.clear();
    }

    private async handleEvent(
        contractName: string,
        eventName: string,
        args: unknown[]
    ): Promise<SynchronizedEvent | null> {
        const event = args.at(-1) as
            | {
                  transactionHash?: string;
                  index?: number;
                  logIndex?: number;
              }
            | undefined;

        const eventArgs =
            event &&
            (
                event.transactionHash !== undefined ||
                event.index !== undefined ||
                event.logIndex !== undefined
            )
                ? args.slice(0, -1)
                : args;

        const transactionHash =
            event?.transactionHash;

        const logIndex =
            event?.index ?? event?.logIndex;

        if (
            transactionHash &&
            await this.bridge.isKnownDestinationTransaction(
                transactionHash
            )
        ) {
            return null;
        }

        const eventIdentity =
            transactionHash !== undefined
                ? `${transactionHash}:${logIndex ?? 0}`
                : `${eventName}:${JSON.stringify(
                      eventArgs.map(serializeArgument)
                  )}`;

        const payload = {
            ...buildEventPayload(
                contractName,
                eventName,
                eventArgs
            ),
            ...(transactionHash !== undefined
                ? { transactionHash }
                : {}),
            ...(logIndex !== undefined
                ? { logIndex }
                : {}),
        };

        const message = createCrossChainMessage({
            messageId: `${this.sourceChain}:${contractName}:${eventIdentity}`,
            sourceChain: this.sourceChain,
            destinationChain: this.destinationChain,
            messageType: `blockchain.${eventName}`,
            timestamp: new Date().toISOString(),
            nonce: eventIdentity,
            payload,
        });

        await this.bridge.relay(message);

        return {
            contract: contractName,
            eventName,
            message,
        };
    }
}
