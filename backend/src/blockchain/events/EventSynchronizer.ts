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

    getPatient?(
        wallet: string
    ): Promise<unknown>;

    getDoctor?(
        wallet: string
    ): Promise<unknown>;

    getHospital?(
        wallet: string
    ): Promise<unknown>;

    getMedicalRecord?(
        recordId: string | number | bigint
    ): Promise<unknown>;
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

    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [
                key,
                serializeArgument(entry),
            ])
        );
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
                    console.log(
                        `[events-debug] RECEIVED ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`
                    );

                    await this.handleEvent(
                        contractName,
                        eventName,
                        args
                    );
                };

                contract.on(eventName, listener);

                console.log(
                    `[events-debug] attached ${this.sourceChain} -> ${this.destinationChain} ${key}`
                );

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

    private async enrichRegistrationEvent(
        contractName: string,
        eventName: string,
        eventArgs: unknown[]
    ): Promise<unknown> {
        if (
            eventName !== "PatientRegistered" &&
            eventName !== "DoctorRegistered" &&
            eventName !== "HospitalRegistered"
        ) {
            return undefined;
        }

        const wallet = eventArgs[1];

        if (typeof wallet !== "string") {
            return undefined;
        }

        let record: unknown;

        if (eventName === "PatientRegistered") {
            record = await this.contracts.patientRegistry?.getPatient?.(
                wallet
            );
        } else if (eventName === "DoctorRegistered") {
            record = await this.contracts.doctorRegistry?.getDoctor?.(
                wallet
            );
        } else {
            record = await this.contracts.hospitalRegistry?.getHospital?.(
                wallet
            );
        }

        if (record === undefined) {
            return undefined;
        }

        return serializeArgument(record);
    }

    private async enrichMedicalRecordEvent(
        eventName: string,
        eventArgs: unknown[]
    ): Promise<unknown> {
        if (
            eventName !== "RecordCreated" &&
            eventName !== "RecordUpdated"
        ) {
            return undefined;
        }

        const recordId = eventArgs[0];

        if (
            recordId === undefined ||
            recordId === null
        ) {
            return undefined;
        }

        const record =
            await this.contracts.medicalRecord
                ?.getMedicalRecord?.(recordId as any);

        if (
            record === undefined ||
            record === null
        ) {
            return undefined;
        }

        return serializeArgument(record);
    }

    private async handleEvent(
        contractName: string,
        eventName: string,
        args: unknown[]
    ): Promise<SynchronizedEvent | null> {
        console.log(
            `[events-debug] HANDLE START ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`
        );
        const event = args.at(-1) as
            | {
                  transactionHash?: string;
                  index?: number;
                  logIndex?: number;
                  log?: {
                      transactionHash?: string;
                      index?: number;
                      logIndex?: number;
                  };
              }
            | undefined;

        const transactionHash =
            event?.transactionHash ??
            event?.log?.transactionHash;

        const logIndex =
            event?.index ??
            event?.logIndex ??
            event?.log?.index ??
            event?.log?.logIndex;

        const eventArgs =
            event &&
            transactionHash !== undefined
                ? args.slice(0, -1)
                : args;

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

        console.log(
            `[events-debug] BEFORE ENRICH ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`
        );

        const registrationRecord =
            await this.enrichRegistrationEvent(
                contractName,
                eventName,
                eventArgs
            );

        const medicalRecord =
            await this.enrichMedicalRecordEvent(
                eventName,
                eventArgs
            );

        const enrichedRecord =
            medicalRecord ??
            registrationRecord;

        console.log(
            `[events-debug] AFTER ENRICH ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`,
            enrichedRecord !== undefined ? "record-present" : "record-missing"
        );

        const payload = {
            ...buildEventPayload(
                contractName,
                eventName,
                eventArgs
            ),
            ...(enrichedRecord !== undefined
                ? { sourceRecord: enrichedRecord }
                : {}),
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
            messageType: eventName,
            timestamp: new Date().toISOString(),
            nonce: eventIdentity,
            payload,
        });

        console.log(
            `[events-debug] BEFORE RELAY ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`
        );

        await this.bridge.relay(message);

        console.log(
            `[events-debug] AFTER RELAY ${this.sourceChain} -> ${this.destinationChain} ${contractName}:${eventName}`
        );

        return {
            contract: contractName,
            eventName,
            message,
        };
    }
}
