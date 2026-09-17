import { BridgeService } from "../bridge/BridgeService";
import { BlockchainType } from "../provider/BlockchainType";
import { EventSynchronizer } from "./EventSynchronizer";
import { FabricEventSynchronizer } from "./FabricEventSynchronizer";

import { ethereum } from "../ethereum/config/ethereum";
import { polygon } from "../polygon/config/polygon";

import { FabricGateway } from "../fabric/FabricGateway";

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

const ethereumToFabric = new EventSynchronizer({
    sourceChain: BlockchainType.ETHEREUM,
    destinationChain: BlockchainType.FABRIC,
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

const polygonToFabric = new EventSynchronizer({
    sourceChain: BlockchainType.POLYGON,
    destinationChain: BlockchainType.FABRIC,
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

const fabricGateway = new FabricGateway();

const fabricToEthereum = new FabricEventSynchronizer({
    destinationChain: BlockchainType.ETHEREUM,
    bridge,
    gateway: fabricGateway,
});

const fabricToPolygon = new FabricEventSynchronizer({
    destinationChain: BlockchainType.POLYGON,
    bridge,
    gateway: fabricGateway,
});

export async function startEventSynchronizers(): Promise<void> {
    ethereumToPolygon.start();
    ethereumToFabric.start();

    polygonToEthereum.start();
    polygonToFabric.start();

    await fabricToEthereum.start();
    await fabricToPolygon.start();

    console.log(
        "[events] Ethereum → Polygon synchronizer started"
    );

    console.log(
        "[events] Ethereum → Fabric synchronizer started"
    );

    console.log(
        "[events] Polygon → Ethereum synchronizer started"
    );

    console.log(
        "[events] Polygon → Fabric synchronizer started"
    );

    console.log(
        "[events] Fabric → Ethereum synchronizer started"
    );

    console.log(
        "[events] Fabric → Polygon synchronizer started"
    );
}

export async function stopEventSynchronizers(): Promise<void> {
    await ethereumToPolygon.stop();
    await ethereumToFabric.stop();

    await polygonToEthereum.stop();
    await polygonToFabric.stop();

    await fabricToEthereum.stop();
    await fabricToPolygon.stop();

    fabricGateway.close();

    console.log(
        "[events] Event synchronizers stopped"
    );
}
