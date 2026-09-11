import {
    EventSynchronizer,
    EventSynchronizerContract,
} from "./EventSynchronizer";

import { BridgeService } from "../bridge/BridgeService";
import { CrossChainMessage } from "../crosschain/CrossChainMessage";
import { BlockchainType } from "../provider/BlockchainType";

function createMockContract() {
    const listeners = new Map<string, (...args: any[]) => void>();

    const contract: EventSynchronizerContract & {
        emit: (event: string, ...args: any[]) => void;
    } = {
        on: jest.fn((event, listener) => {
            listeners.set(event, listener);
        }),

        off: jest.fn((event) => {
            listeners.delete(event);
        }),

        emit: (event, ...args) => {
            listeners.get(event)?.(...args);
        },
    };

    return contract;
}

describe("EventSynchronizer", () => {
    it("registers listeners for supported blockchain events", () => {
        const contract = createMockContract();
        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                status: "accepted",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false),
        } as unknown as BridgeService;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            contracts: {
                medicalRecord: contract,
            },
            bridge,
        });

        synchronizer.start();

        expect(contract.on).toHaveBeenCalledWith(
            "RecordCreated",
            expect.any(Function)
        );

        expect(contract.on).toHaveBeenCalledWith(
            "AccessGranted",
            expect.any(Function)
        );
    });

    it("does not register duplicate listeners when started twice", () => {
        const contract = createMockContract();
        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                status: "accepted",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false),
        } as unknown as BridgeService;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            contracts: {
                medicalRecord: contract,
            },
            bridge,
        });

        synchronizer.start();
        synchronizer.start();

        const recordCreatedCalls =
            (contract.on as jest.Mock).mock.calls.filter(
                ([event]) => event === "RecordCreated"
            );

        expect(recordCreatedCalls).toHaveLength(1);
    });

    it("converts a blockchain event into a cross-chain message", async () => {
        const contract = createMockContract();
        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                status: "accepted",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false),
        } as unknown as BridgeService;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            contracts: {
                medicalRecord: contract,
            },
            bridge,
        });

        synchronizer.start();

        const relaySpy = bridge.relay as jest.Mock;

        contract.emit(
            "RecordCreated",
            42n,
            "0xpatient",
            "0xdoctor",
            "0xhospital",
            "prescription",
            123n,
            {
                transactionHash: "0xtx123",
                index: 7
            }
        );

        await new Promise(resolve => setImmediate(resolve));

        expect(relaySpy).toHaveBeenCalledTimes(1);

        const message =
            relaySpy.mock.calls[0][0];

        expect(message.messageId).toBe(
            "ethereum:medicalRecord:0xtx123:7"
        );

        expect(message.nonce).toBe(
            "0xtx123:7"
        );
    });

    it("serializes bigint event arguments", () => {
        const contract = createMockContract();
        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                status: "accepted",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false),
        } as unknown as BridgeService;

        const relaySpy = bridge.relay as jest.Mock;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.POLYGON,
            destinationChain: BlockchainType.ETHEREUM,
            contracts: {
                medicalRecord: contract,
            },
            bridge,
        });

        synchronizer.start();

        contract.emit(
            "RecordUpdated",
            99n,
            3n,
            456n
        );

        expect(relaySpy).toHaveBeenCalledTimes(1);

        const message =
            relaySpy.mock.calls[0][0] as CrossChainMessage<{
                contract: string;
                eventName: string;
                args: string[];
            }>;

        expect(message.sourceChain).toBe(
            BlockchainType.POLYGON
        );

        expect(message.destinationChain).toBe(
            BlockchainType.ETHEREUM
        );

        expect(message.payload.args).toEqual([
            "99",
            "3",
            "456",
        ]);
    });

    it("does not relay a bridge-generated destination transaction", async () => {
        const contract = createMockContract();

        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.POLYGON,
                destinationChain: BlockchainType.ETHEREUM,
                status: "confirmed",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(true),
        } as unknown as BridgeService;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.POLYGON,
            destinationChain: BlockchainType.ETHEREUM,
            contracts: {
                doctorRegistry: contract,
            },
            bridge,
        });

        synchronizer.start();

        contract.emit(
            "DoctorVerified",
            "0x1234567890123456789012345678901234567890",
            {
                transactionHash: "0xbridgegenerated",
                index: 0,
            }
        );

        await new Promise((resolve) =>
            setImmediate(resolve)
        );

        expect(
            bridge.isKnownDestinationTransaction
        ).toHaveBeenCalledWith(
            "0xbridgegenerated"
        );

        expect(bridge.relay).not.toHaveBeenCalled();
    });

    it("stops registered listeners", async () => {
        const contract = createMockContract();
        const bridge = {
            relay: jest.fn().mockResolvedValue({
                messageId: "test",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                status: "accepted",
            }),
            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false),
        } as unknown as BridgeService;

        const synchronizer = new EventSynchronizer({
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            contracts: {
                medicalRecord: contract,
            },
            bridge,
        });

        synchronizer.start();
        await synchronizer.stop();

        expect(contract.off).toHaveBeenCalled();
    });

    it("rejects identical source and destination chains", () => {
        const contract = createMockContract();

        expect(
            () =>
                new EventSynchronizer({
                    sourceChain: BlockchainType.ETHEREUM,
                    destinationChain: BlockchainType.ETHEREUM,
                    contracts: {
                        medicalRecord: contract,
                    },
                    bridge: new BridgeService(),
                })
        ).toThrow(
            "Source and destination chains must be different"
        );
    });
});
