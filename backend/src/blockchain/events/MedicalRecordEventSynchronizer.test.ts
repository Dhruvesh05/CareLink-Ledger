import {
    EventSynchronizer,
    EventSynchronizerContract
} from "./EventSynchronizer";

import {
    BlockchainType
} from "../provider/BlockchainType";

describe("EventSynchronizer medical-record enrichment", () => {
    it("enriches RecordCreated with source-chain record data", async () => {
        const listeners =
            new Map<string, (...args: any[]) => void>();

        const sourceRecord = {
            recordId: 42,
            patient:
                "0x1111111111111111111111111111111111111111",
            doctor:
                "0x2222222222222222222222222222222222222222",
            hospital:
                "0x3333333333333333333333333333333333333333",
            ipfsHash: "bafy-test-cid",
            fileHash: "sha256-test",
            category: "E2E_TEST",
            emergency: false,
            version: 1
        };

        const contract: EventSynchronizerContract = {
            on: jest.fn((event, listener) => {
                listeners.set(event, listener);
            }),

            off: jest.fn((event) => {
                for (const [key] of listeners) {
                    if (key === event) {
                        listeners.delete(key);
                    }
                }
            }),

            getMedicalRecord:
                jest.fn().mockResolvedValue(sourceRecord)
        };

        const bridge = {
            relay:
                jest.fn().mockResolvedValue({
                    status: "confirmed"
                }),

            isKnownDestinationTransaction:
                jest.fn().mockResolvedValue(false)
        };

        const synchronizer =
            new EventSynchronizer({
                sourceChain:
                    BlockchainType.ETHEREUM,
                destinationChain:
                    BlockchainType.POLYGON,
                contracts: {
                    medicalRecord: contract
                },
                bridge: bridge as any
            });

        synchronizer.start();

        await listeners
            .get("RecordCreated")!(
                42,
                "0x1111111111111111111111111111111111111111",
                "0x2222222222222222222222222222222222222222",
                "0x3333333333333333333333333333333333333333",
                "E2E_TEST",
                123456,
                {
                    transactionHash: "0xsource",
                    logIndex: 7
                }
            );

        expect(
            contract.getMedicalRecord
        ).toHaveBeenCalledWith(42);

        expect(
            bridge.relay
        ).toHaveBeenCalledTimes(1);

        const message =
            bridge.relay.mock.calls[0][0];

        expect(
            message.payload.sourceRecord
        ).toEqual(sourceRecord);

        await synchronizer.stop();
    });
});
