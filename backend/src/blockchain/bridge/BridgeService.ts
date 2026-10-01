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

interface FabricBridgeProvider
    extends IBlockchainProvider {

    registerPatientFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ): Promise<any>;

    registerDoctorFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        fullNameHash: string,
        licenseNumberHash: string,
        specialization: string,
        hospitalWallet: string
    ): Promise<any>;

    registerHospitalFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ): Promise<any>;
}

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
    | "PatientRegistered"
    | "DoctorRegistered"
    | "HospitalRegistered"
    | "PatientReactivated"
    | "DoctorVerified"
    | "DoctorVerificationRevoked"
    | "DoctorReactivated"
    | "HospitalVerified"
    | "HospitalVerificationRevoked"
    | "HospitalReactivated"
    | "RecordCreated"
    | "RecordUpdated"
    | "RecordDeactivated"
    | "AccessGranted"
    | "AccessRevoked";

const RELAYABLE_EVENTS =
    new Set<RelayableEvent>([
        "PatientRegistered",
        "DoctorRegistered",
        "HospitalRegistered",
        "PatientReactivated",
        "DoctorVerified",
        "DoctorVerificationRevoked",
        "DoctorReactivated",
        "HospitalVerified",
        "HospitalVerificationRevoked",
        "HospitalReactivated",

        // Canonical medical-record events.
        //
        // EmergencyRecordCreated and MetadataUpdated intentionally do
        // not relay independently:
        //   - EmergencyRecordCreated accompanies RecordCreated.
        //   - MetadataUpdated accompanies RecordUpdated.
        // Relaying both would duplicate destination operations.
        "RecordCreated",
        "RecordUpdated",
        "RecordDeactivated",
        "AccessGranted",
        "AccessRevoked"
    ]);

function extractTransactionHash(
    result: any
): string | undefined {

    return (
        result?.hash ??
        result?.transactionHash ??
        result?.transactionId
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

    const eventName = payload.eventName;

    // Fabric uses the contract-prefixed names while EVM events use the
    // canonical names consumed by the destination providers.
    switch (eventName) {
        case "MedicalRecordCreated":
            return "RecordCreated";
        case "MedicalRecordUpdated":
            return "RecordUpdated";
        case "MedicalRecordDeactivated":
            return "RecordDeactivated";
        default:
            return eventName;
    }
}


function messagePayload(
    message: CrossChainMessage
): Record<string, any> {
    return (message.payload ?? {}) as Record<string, any>;
}

function messageArgs(
    message: CrossChainMessage
): any[] {
    const args = messagePayload(message).args;
    return Array.isArray(args) ? args : [];
}

function readBridgeField(
    value: any,
    names: string[],
    indexes: number[] = []
): any {
    if (value !== undefined && value !== null) {
        for (const name of names) {
            if (
                typeof value === "object" &&
                value[name] !== undefined &&
                value[name] !== null
            ) {
                return value[name];
            }
        }

        for (const index of indexes) {
            if (
                Array.isArray(value) &&
                value[index] !== undefined &&
                value[index] !== null
            ) {
                return value[index];
            }

            if (
                typeof value === "object" &&
                value[index] !== undefined &&
                value[index] !== null
            ) {
                return value[index];
            }
        }
    }

    return undefined;
}

function requireBridgeString(
    value: unknown,
    field: string
): string {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(
            `Relayable medical-record event is missing ${field}`
        );
    }

    return value;
}

function requireBridgeRecordId(
    message: CrossChainMessage,
    sourceRecord?: any
): number {
    const payload = messagePayload(message);
    const args = messageArgs(message);

    const raw =
        readBridgeField(
            sourceRecord,
            [
                "recordId",
                "RecordID",
                "recordID",
                "id",
                "ID",
                "sourceRecordId",
                "SourceRecordID"
            ],
            [0]
        ) ??
        payload.sourceRecordId ??
        args[0];

    const numberValue = Number(raw);

    if (
        !Number.isSafeInteger(numberValue) ||
        numberValue <= 0
    ) {
        throw new Error(
            "Relayable medical-record event contains an invalid source record id"
        );
    }

    return numberValue;
}

function bridgeSourceRecord(
    message: CrossChainMessage
): any {
    return messagePayload(message).sourceRecord;
}

function bridgePatient(
    message: CrossChainMessage,
    record: any
): string {
    const args = messageArgs(message);

    return requireBridgeString(
        readBridgeField(
            record,
            [
                "patient",
                "Patient",
                "patientWallet",
                "PatientWallet",
                "patientID",
                "PatientID"
            ],
            [1]
        ) ??
            readBridgeField(
                messagePayload(message),
                ["patient", "patientWallet"],
                []
            ) ??
            args[1],
        "patient"
    );
}

function bridgeDoctor(
    message: CrossChainMessage,
    record: any
): string {
    const args = messageArgs(message);

    return requireBridgeString(
        readBridgeField(
            record,
            [
                "doctor",
                "Doctor",
                "doctorWallet",
                "DoctorWallet",
                "doctorID",
                "DoctorID"
            ],
            [2]
        ) ??
            readBridgeField(
                messagePayload(message),
                ["doctor", "doctorWallet", "doctorID"],
                []
            ) ??
            args[2],
        "doctor"
    );
}

function bridgeHospital(
    message: CrossChainMessage,
    record: any
): string {
    const args = messageArgs(message);

    return requireBridgeString(
        readBridgeField(
            record,
            [
                "hospital",
                "Hospital",
                "hospitalWallet",
                "HospitalWallet",
                "hospitalID",
                "HospitalID"
            ],
            [3]
        ) ??
            readBridgeField(
                messagePayload(message),
                ["hospital", "hospitalWallet", "hospitalID"],
                []
            ) ??
            args[3],
        "hospital"
    );
}

function bridgeIpfsHash(
    record: any
): string {
    return requireBridgeString(
        readBridgeField(
            record,
            [
                "ipfsHash",
                "IPFSHash",
                "ipfs",
                "IPFS",
                "cid",
                "CID"
            ]
        ),
        "ipfsHash"
    );
}

function bridgeFabricIdentityId(
    sourceChain: string,
    wallet: string
): string {
    return `${sourceChain}_${wallet}`;
}

function bridgeEvmIdentityId(
    identity: string
): string {
    return identity.replace(
        /^(ethereum|polygon)_/,
        ""
    );
}

function bridgeFileHash(
    record: any
): string {
    return requireBridgeString(
        readBridgeField(
            record,
            [
                "fileHash",
                "FileHash"
            ]
        ),
        "fileHash"
    );
}

function bridgeCategory(
    message: CrossChainMessage,
    record: any
): string {
    const args = messageArgs(message);

    return requireBridgeString(
        readBridgeField(
            record,
            [
                "category",
                "Category"
            ],
            [4]
        ) ??
            args[4],
        "category"
    );
}

function bridgeEmergency(
    record: any
): boolean {
    const raw =
        readBridgeField(
            record,
            [
                "emergency",
                "Emergency",
                "isEmergency",
                "IsEmergency"
            ]
        );

    if (typeof raw === "boolean") {
        return raw;
    }

    if (typeof raw === "string") {
        if (raw.toLowerCase() === "true") {
            return true;
        }

        if (raw.toLowerCase() === "false") {
            return false;
        }
    }

    return false;
}

function bridgeVersion(
    message: CrossChainMessage,
    record: any
): number {
    const args = messageArgs(message);

    const raw =
        readBridgeField(
            record,
            [
                "version",
                "Version"
            ]
        ) ??
        args[1];

    const value = Number(raw);

    if (
        !Number.isSafeInteger(value) ||
        value < 0
    ) {
        throw new Error(
            "Relayable medical-record update contains an invalid version"
        );
    }

    return value;
}

function bridgeActor(
    message: CrossChainMessage,
    record: any
): string {
    const args = messageArgs(message);

    return requireBridgeString(
        readBridgeField(
            record,
            [
                "actor",
                "Actor",
                "deactivatedBy",
                "DeactivatedBy",
                "updatedBy",
                "UpdatedBy"
            ]
        ) ??
            args[1],
        "actor"
    );
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

                case BlockchainType.FABRIC: {
                    const { FabricProvider } =
                        require("../fabric/provider/FabricProvider");

                    destinationProvider =
                        new FabricProvider();
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

            let wallet = "";

            const walletBasedEvents =
                new Set<RelayableEvent>([
                    "PatientRegistered",
                    "DoctorRegistered",
                    "HospitalRegistered",
                    "PatientReactivated",
                    "DoctorVerified",
                    "DoctorVerificationRevoked",
                    "DoctorReactivated",
                    "HospitalVerified",
                    "HospitalVerificationRevoked",
                    "HospitalReactivated"
                ]);

            if (
                walletBasedEvents.has(
                    eventName as RelayableEvent
                )
            ) {
                wallet = extractWallet(message);
            }

            let result: any;

            switch (eventName as RelayableEvent) {

                case "RecordCreated": {
                    const record =
                        bridgeSourceRecord(message);

                    if (!record) {
                        throw new Error(
                            "RecordCreated event is missing sourceRecord"
                        );
                    }

                    const sourceRecordId =
                        requireBridgeRecordId(
                            message,
                            record
                        );

                    const patient =
                        bridgePatient(message, record);

                    const doctor =
                        bridgeDoctor(message, record);

                    const hospital =
                        bridgeHospital(message, record);

                    const isFabricDestination =
                        message.destinationChain ===
                        BlockchainType.FABRIC;

                    result =
                        await destinationProvider
                            .createMedicalRecordFromBridge(
                                message.messageId,
                                message.sourceChain,
                                sourceRecordId,
                                isFabricDestination
                                    ? bridgeFabricIdentityId(
                                          message.sourceChain,
                                          patient
                                      )
                                    : bridgeEvmIdentityId(
                                          patient
                                      ),
                                isFabricDestination
                                    ? bridgeFabricIdentityId(
                                          message.sourceChain,
                                          doctor
                                      )
                                    : bridgeEvmIdentityId(
                                          doctor
                                      ),
                                isFabricDestination
                                    ? bridgeFabricIdentityId(
                                          message.sourceChain,
                                          hospital
                                      )
                                    : bridgeEvmIdentityId(
                                          hospital
                                      ),
                                bridgeIpfsHash(record),
                                bridgeFileHash(record),
                                bridgeCategory(message, record),
                                bridgeEmergency(record)
                            );

                    break;
                }

                case "RecordUpdated": {
                    const record =
                        bridgeSourceRecord(message);

                    if (!record) {
                        throw new Error(
                            "RecordUpdated event is missing sourceRecord"
                        );
                    }

                    const sourceRecordId =
                        requireBridgeRecordId(
                            message,
                            record
                        );

                    result =
                        await destinationProvider
                            .updateMedicalRecordFromBridge(
                                message.messageId,
                                message.sourceChain,
                                sourceRecordId,
                                bridgeIpfsHash(record),
                                bridgeFileHash(record),
                                bridgeCategory(message, record),
                                bridgeVersion(message, record)
                            );

                    break;
                }

                case "RecordDeactivated": {
                    const record =
                        bridgeSourceRecord(message);

                    const sourceRecordId =
                        requireBridgeRecordId(
                            message,
                            record
                        );

                    result =
                        await destinationProvider
                            .deactivateMedicalRecordFromBridge(
                                message.messageId,
                                message.sourceChain,
                                sourceRecordId,
                                bridgeActor(message, record)
                            );

                    break;
                }

                case "AccessGranted": {
                    const record =
                        bridgeSourceRecord(message);

                    const sourceRecordId =
                        requireBridgeRecordId(
                            message,
                            record
                        );

                    result =
                        await destinationProvider
                            .grantAccessFromBridge(
                                message.messageId,
                                message.sourceChain,
                                sourceRecordId,
                                bridgeDoctor(message, record)
                            );

                    break;
                }

                case "AccessRevoked": {
                    const record =
                        bridgeSourceRecord(message);

                    const sourceRecordId =
                        requireBridgeRecordId(
                            message,
                            record
                        );

                    result =
                        await destinationProvider
                            .revokeAccessFromBridge(
                                message.messageId,
                                message.sourceChain,
                                sourceRecordId,
                                bridgeDoctor(message, record)
                            );

                    break;
                }

                case "PatientRegistered": {
                    const record =
                        (message.payload as any).sourceRecord;

                    if (!record) {
                        throw new Error(
                            "PatientRegistered event is missing sourceRecord"
                        );
                    }

                    if (
                        message.destinationChain ===
                        BlockchainType.FABRIC
                    ) {
                        result =
                            await (
                                destinationProvider as FabricBridgeProvider
                            ).registerPatientFromBridge(
                                message.messageId,
                                message.sourceChain,
                                record.wallet,
                                record.fullNameHash,
                                record.dobHash,
                                record.bloodGroup,
                                record.gender
                            );
                    } else if (
                        message.destinationChain ===
                        BlockchainType.ETHEREUM ||
                        message.destinationChain ===
                        BlockchainType.POLYGON
                    ) {
                        result =
                            await (
                                destinationProvider as any
                            ).registerPatientFromBridge(
                                message.messageId,
                                record.wallet,
                                record.fullNameHash,
                                record.dobHash,
                                record.bloodGroup,
                                record.gender
                            );
                    } else {
                        throw new Error(
                            `PatientRegistered relay to ${message.destinationChain} is not supported`
                        );
                    }

                    break;
                }

                case "HospitalRegistered": {
                    const record =
                        (message.payload as any).sourceRecord;

                    if (!record) {
                        throw new Error(
                            "HospitalRegistered event is missing sourceRecord"
                        );
                    }

                    if (
                        message.destinationChain ===
                        BlockchainType.FABRIC
                    ) {
                        result =
                            await (
                                destinationProvider as FabricBridgeProvider
                            ).registerHospitalFromBridge(
                                message.messageId,
                                message.sourceChain,
                                record.wallet,
                                record.hospitalNameHash,
                                record.registrationNumberHash,
                                record.locationHash
                            );
                    } else if (
                        message.destinationChain ===
                        BlockchainType.ETHEREUM ||
                        message.destinationChain ===
                        BlockchainType.POLYGON
                    ) {
                        result =
                            await (
                                destinationProvider as any
                            ).registerHospitalFromBridge(
                                message.messageId,
                                record.wallet,
                                record.hospitalNameHash,
                                record.registrationNumberHash,
                                record.locationHash
                            );
                    } else {
                        throw new Error(
                            `HospitalRegistered relay to ${message.destinationChain} is not supported`
                        );
                    }

                    break;
                }

                case "DoctorRegistered": {
                    const record =
                        (message.payload as any).sourceRecord;

                    if (!record) {
                        throw new Error(
                            "DoctorRegistered event is missing sourceRecord"
                        );
                    }

                    if (
                        message.destinationChain ===
                        BlockchainType.FABRIC
                    ) {
                        result =
                            await (
                                destinationProvider as FabricBridgeProvider
                            ).registerDoctorFromBridge(
                                message.messageId,
                                message.sourceChain,
                                record.wallet,
                                record.fullNameHash,
                                record.licenseNumberHash,
                                record.specialization,
                                record.hospital
                            );
                    } else if (
                        message.destinationChain ===
                        BlockchainType.ETHEREUM ||
                        message.destinationChain ===
                        BlockchainType.POLYGON
                    ) {
                        result =
                            await (
                                destinationProvider as any
                            ).registerDoctorFromBridge(
                                message.messageId,
                                record.wallet,
                                record.fullNameHash,
                                record.licenseNumberHash,
                                record.specialization,
                                record.hospital
                            );
                    } else {
                        throw new Error(
                            `DoctorRegistered relay to ${message.destinationChain} is not supported`
                        );
                    }

                    break;
                }

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

            console.error(
                "[bridge] RELAY FAILED",
                message.messageId,
                error
            );

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
