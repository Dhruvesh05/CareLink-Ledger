import { checkpointers } from "@hyperledger/fabric-gateway";

import {
    CrossChainMessage,
    createCrossChainMessage,
} from "../crosschain/CrossChainMessage";
import { BridgeService } from "../bridge/BridgeService";
import { BlockchainType } from "../provider/BlockchainType";
import { FabricGateway } from "../fabric/FabricGateway";

interface FabricEventPayload {
    [key: string]: unknown;
}

export interface FabricEventSynchronizerConfig {
    destinationChain: BlockchainType;
    bridge: BridgeService;
    gateway?: FabricGateway;
    chaincode?: string;
    startBlock?: bigint;
}

const RELAYABLE_FABRIC_EVENTS = new Set([
    "PatientRegistered",
    "PatientReactivated",
    "DoctorRegistered",
    "DoctorVerified",
    "DoctorVerificationRevoked",
    "DoctorReactivated",
    "HospitalRegistered",
    "HospitalVerified",
    "HospitalVerificationRevoked",
    "HospitalReactivated",

    // Native Fabric medical-record events.
    "MedicalRecordCreated",
    "MedicalRecordUpdated",
    "MedicalRecordDeactivated",
    "AccessGranted",
    "AccessRevoked",
]);

function parsePayload(payload: Uint8Array): FabricEventPayload {
    const text = Buffer.from(payload).toString("utf8");

    if (!text.trim()) {
        return {};
    }

    try {
        const parsed = JSON.parse(text);

        if (
            parsed !== null &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {
            return parsed as FabricEventPayload;
        }

        return { value: parsed };
    } catch {
        return { raw: text };
    }
}

function readField(
    value: Record<string, unknown>,
    ...names: string[]
): unknown {
    for (const name of names) {
        if (
            value[name] !== undefined &&
            value[name] !== null
        ) {
            return value[name];
        }
    }

    return undefined;
}

function normalizeSourceRecord(
    eventName: string,
    decoded: FabricEventPayload
): FabricEventPayload {
    if (eventName === "PatientRegistered") {
        return {
            ...decoded,
            wallet: readField(
                decoded,
                "wallet",
                "Wallet"
            ),
            fullNameHash: readField(
                decoded,
                "fullNameHash",
                "name",
                "Name"
            ),
            dobHash: readField(
                decoded,
                "dobHash",
                "dateOfBirth",
                "DateOfBirth"
            ),
            bloodGroup: readField(
                decoded,
                "bloodGroup",
                "BloodGroup"
            ),
            gender: readField(
                decoded,
                "gender",
                "Gender"
            ),
        };
    }

    if (eventName === "DoctorRegistered") {
        return {
            ...decoded,
            wallet: readField(
                decoded,
                "wallet",
                "Wallet"
            ),
            fullNameHash: readField(
                decoded,
                "fullNameHash",
                "name",
                "Name"
            ),
            licenseNumberHash: readField(
                decoded,
                "licenseNumberHash",
                "licenseNumber",
                "LicenseNumber"
            ),
            specialization: readField(
                decoded,
                "specialization",
                "Specialization"
            ),
            hospital: readField(
                decoded,
                "hospital",
                "hospitalWallet",
                "Hospital"
            ),
        };
    }

    if (eventName === "HospitalRegistered") {
        return {
            ...decoded,
            wallet: readField(
                decoded,
                "wallet",
                "Wallet"
            ),
            hospitalNameHash: readField(
                decoded,
                "hospitalNameHash",
                "name",
                "Name"
            ),
            registrationNumberHash: readField(
                decoded,
                "registrationNumberHash",
                "registrationNumber",
                "RegistrationNumber"
            ),
            locationHash: readField(
                decoded,
                "locationHash",
                "location",
                "Location"
            ),
        };
    }

    if (
        eventName === "MedicalRecordCreated" ||
        eventName === "MedicalRecordUpdated" ||
        eventName === "MedicalRecordDeactivated" ||
        eventName === "AccessGranted" ||
        eventName === "AccessRevoked"
    ) {
        const nestedRecord =
            readField(
                decoded,
                "record",
                "Record",
                "medicalRecord",
                "MedicalRecord",
                "grant",
                "Grant",
                "accessGrant",
                "AccessGrant"
            );

        const base =
            nestedRecord !== null &&
            typeof nestedRecord === "object"
                ? nestedRecord as Record<string, unknown>
                : decoded;

        return {
            ...decoded,
            recordId: readField(
                base,
                "recordId",
                "RecordID",
                "recordID",
                "id",
                "ID",
                "medicalRecordId",
                "MedicalRecordID"
            ),
            patient: readField(
                base,
                "patient",
                "Patient",
                "patientWallet",
                "PatientWallet",
                "patientId",
                "PatientID"
            ),
            doctor: readField(
                base,
                "doctor",
                "Doctor",
                "doctorWallet",
                "DoctorWallet",
                "doctorId",
                "DoctorID",
                "granteeId",
                "GranteeID"
            ),
            hospital: readField(
                base,
                "hospital",
                "Hospital",
                "hospitalWallet",
                "HospitalWallet",
                "hospitalId",
                "HospitalID"
            ),
            ipfsHash: readField(
                base,
                "ipfsHash",
                "IPFSHash",
                "ipfs",
                "IPFS",
                "cid",
                "CID"
            ),
            fileHash: readField(
                base,
                "fileHash",
                "FileHash"
            ),
            category: readField(
                base,
                "category",
                "Category"
            ),
            emergency: readField(
                base,
                "emergency",
                "Emergency",
                "isEmergency",
                "IsEmergency"
            ),
            version: readField(
                base,
                "version",
                "Version"
            ),
            actor: readField(
                base,
                "actor",
                "Actor",
                "deactivatedBy",
                "DeactivatedBy",
                "updatedBy",
                "UpdatedBy"
            )
        };
    }

    return decoded;
}

function canonicalPayload(
    eventName: string,
    event: {
        blockNumber: bigint;
        transactionId: string;
        chaincodeName: string;
        payload: Uint8Array;
    }
) {
    const decoded = parsePayload(event.payload);

    const sourceRecord =
        normalizeSourceRecord(
            eventName,
            decoded
        );

    const wallet = readField(
        sourceRecord,
        "wallet",
        "Wallet"
    );

    const recordId = readField(
        sourceRecord,
        "recordId",
        "RecordID",
        "recordID",
        "id",
        "ID",
        "medicalRecordId",
        "MedicalRecordID"
    );

    const patient = readField(
        sourceRecord,
        "patient",
        "Patient",
        "patientWallet",
        "PatientWallet",
        "patientId",
        "PatientID"
    );

    const doctor = readField(
        sourceRecord,
        "doctor",
        "Doctor",
        "doctorWallet",
        "DoctorWallet",
        "doctorId",
        "DoctorID",
        "granteeId",
        "GranteeID"
    );

    let args: unknown[] = [wallet];

    if (
        eventName === "MedicalRecordCreated" ||
        eventName === "MedicalRecordUpdated" ||
        eventName === "MedicalRecordDeactivated"
    ) {
        args = [recordId];
    } else if (
        eventName === "AccessGranted" ||
        eventName === "AccessRevoked"
    ) {
        args = [
            recordId,
            patient,
            doctor
        ];
    }

    return {
        contract: "fabric",
        eventName,
        args,
        sourceRecord,
        blockNumber:
            event.blockNumber.toString(),
        transactionHash:
            event.transactionId,
    };
}


export class FabricEventSynchronizer {
    private readonly destinationChain: BlockchainType;
    private readonly bridge: BridgeService;
    private readonly gateway: FabricGateway;
    private readonly chaincode: string;
    private readonly startBlock?: bigint;

    private running = false;
    private events?: {
        close(): void;
        [Symbol.asyncIterator](): AsyncIterator<any>;
    };

    constructor(config: FabricEventSynchronizerConfig) {
        if (config.destinationChain === BlockchainType.FABRIC) {
            throw new Error(
                "Fabric cannot be its own event destination"
            );
        }

        if (config.destinationChain === BlockchainType.BRIDGE) {
            throw new Error(
                "Bridge cannot be a Fabric event destination"
            );
        }

        this.destinationChain = config.destinationChain;
        this.bridge = config.bridge;
        this.gateway = config.gateway ?? new FabricGateway();
        this.chaincode =
            config.chaincode ??
            process.env.FABRIC_CHAINCODE ??
            "carelink";
        this.startBlock = config.startBlock;
    }

    async start(): Promise<void> {
        if (this.running) {
            return;
        }

        this.running = true;

        this.gateway.connect();

        const network = this.gateway.getNetwork();

        const checkpoint = checkpointers.inMemory();

        this.events = await network.getChaincodeEvents(
            this.chaincode,
            {
                ...(this.startBlock !== undefined
                    ? { startBlock: this.startBlock }
                    : {}),
                checkpoint,
            }
        );

        console.log(
            `[fabric-events] listening Fabric -> ${this.destinationChain}`
        );

        void this.consume(checkpoint);
    }

    async stop(): Promise<void> {
        this.running = false;

        if (this.events) {
            this.events.close();
            this.events = undefined;
        }
    }

    private async consume(checkpoint: any): Promise<void> {
        const events = this.events;

        if (!events) {
            return;
        }

        try {
            for await (const event of events as any) {
                if (!this.running) {
                    break;
                }

                if (
                    !RELAYABLE_FABRIC_EVENTS.has(
                        event.eventName
                    )
                ) {
                    continue;
                }

                const payload =
                    canonicalPayload(
                        event.eventName,
                        event
                    );

                const eventIdentity =
                    `${event.blockNumber.toString()}:${event.transactionId}:${event.eventName}`;

                const routeIdentity =
                    `${eventIdentity}:${this.destinationChain}`;

                const message: CrossChainMessage =
                    createCrossChainMessage({
                        messageId:
                            `fabric:${event.transactionId}:${event.eventName}:${this.destinationChain}`,
                        sourceChain:
                            BlockchainType.FABRIC,
                        destinationChain:
                            this.destinationChain,
                        messageType:
                            event.eventName,
                        timestamp:
                            new Date().toISOString(),
                        nonce: routeIdentity,
                        payload,
                    });

                console.log(
                    `[fabric-events] RECEIVED Fabric -> ${this.destinationChain} ${event.eventName} tx=${event.transactionId} block=${event.blockNumber.toString()}`
                );

                const knownDestination =
                    await this.bridge
                        .isKnownDestinationTransaction(
                            event.transactionId
                        );

                const result =
                    knownDestination;

                    if (knownDestination) {
                        console.log(
                            `[fabric-events] ignoring destination-generated event tx=${event.transactionId}`
                        );

                        await checkpoint.checkpointChaincodeEvent(
                            event
                        );

                        continue;
                    }

                    await this.bridge.relay(message);

                console.log(
                    `[fabric-events] RELAY RESULT Fabric -> ${this.destinationChain} ${event.eventName}`,
                    result
                );

                await checkpoint.checkpointChaincodeEvent(
                    event
                );
            }
        } catch (error) {
            console.error(
                `[fabric-events] listener failed Fabric -> ${this.destinationChain}`,
                error
            );
        }
    }
}
