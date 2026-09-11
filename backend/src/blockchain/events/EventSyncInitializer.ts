import { BridgeService } from "../bridge/BridgeService";
import { BlockchainType } from "../provider/BlockchainType";
import { EventSynchronizer } from "./EventSynchronizer";

import { ethereum } from "../ethereum/config/ethereum";
import { polygon } from "../polygon/config/polygon";

const bridge = new BridgeService();

const ethereumToPolygon = new EventSynchronizer({
    sourceChain: BlockchainType.ETHEREUM,
    destinationChain: BlockchainType.POLYGON,
    contracts: {
        accessControl: ethereum.accessControl,
        patientRegistry: ethereum.patientRegistry,
        doctorRegistry: ethereum.doctorRegistry,
        hospitalRegistry: ethereum.hospitalRegistry,
        medicalRecord: ethereum.medicalRecord,
        auditLog: ethereum.auditLog,
    },
    bridge,
});

const polygonToEthereum = new EventSynchronizer({
    sourceChain: BlockchainType.POLYGON,
    destinationChain: BlockchainType.ETHEREUM,
    contracts: {
        accessControl: polygon.accessControl,
        patientRegistry: polygon.patientRegistry,
        doctorRegistry: polygon.doctorRegistry,
        hospitalRegistry: polygon.hospitalRegistry,
        medicalRecord: polygon.medicalRecord,
        auditLog: polygon.auditLog,
    },
    bridge,
});

export function startEventSynchronizers(): void {
    ethereumToPolygon.start();
    polygonToEthereum.start();

    console.log("[events] Ethereum → Polygon synchronizer started");
    console.log("[events] Polygon → Ethereum synchronizer started");
}

export async function stopEventSynchronizers(): Promise<void> {
    await ethereumToPolygon.stop();
    await polygonToEthereum.stop();

    console.log("[events] Event synchronizers stopped");
}
