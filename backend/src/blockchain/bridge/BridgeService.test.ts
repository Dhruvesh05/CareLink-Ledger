import {
    BridgeService
} from "./BridgeService";

import {
    createCrossChainMessage
} from "../crosschain/CrossChainMessage";

import {
    BlockchainType
} from "../provider/BlockchainType";

describe("BridgeService", () => {

    const wallet =
        "0x1111111111111111111111111111111111111111";

    const createMessage = (
        eventName: string,
        messageId = "msg-001",
        sourceChain = BlockchainType.ETHEREUM,
        destinationChain = BlockchainType.POLYGON
    ) =>
        createCrossChainMessage({
            messageId,
            sourceChain,
            destinationChain,
            messageType: `blockchain.${eventName}`,
            timestamp: "2026-09-10T00:00:00.000Z",
            nonce: messageId,
            payload: {
                eventName,
                args: [wallet],
                transactionHash: "0xsource",
                logIndex: 1
            }
        });

    const createAuditService = (
        status: "accepted" | "duplicate" = "accepted"
    ) => ({
        recordAccepted: jest.fn()
            .mockResolvedValue(status),

        markRelaying: jest.fn()
            .mockResolvedValue(undefined),

        markConfirmed: jest.fn()
            .mockResolvedValue(undefined),

        markFailed: jest.fn()
            .mockResolvedValue(undefined)
    });

    const createProvider = () => ({
        reactivatePatient: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        verifyDoctor: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        revokeDoctorVerification: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        reactivateDoctor: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        verifyHospital: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        revokeHospitalVerification: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            }),

        reactivateHospital: jest.fn()
            .mockResolvedValue({
                hash: "0xdestination"
            })
    });

    const createBridge = (
        auditService = createAuditService(),
        provider = createProvider()
    ) =>
        new BridgeService(
            auditService as any,
            {
                [BlockchainType.POLYGON]: provider as any,
                [BlockchainType.ETHEREUM]: provider as any
            }
        );

    it("relays Ethereum-to-Polygon DoctorVerified", async () => {

        const auditService =
            createAuditService();

        const provider =
            createProvider();

        const bridge =
            createBridge(
                auditService,
                provider
            );

        const message =
            createMessage(
                "DoctorVerified"
            );

        const result =
            await bridge.relay(message);

        expect(result).toEqual({
            messageId: "msg-001",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            status: "confirmed",
            destinationTransactionHash:
                "0xdestination"
        });

        expect(
            provider.verifyDoctor
        ).toHaveBeenCalledWith(wallet);

        expect(
            auditService.recordAccepted
        ).toHaveBeenCalledWith(message);

        expect(
            auditService.markRelaying
        ).toHaveBeenCalledWith("msg-001");

        expect(
            auditService.markConfirmed
        ).toHaveBeenCalledWith(
            "msg-001",
            "0xdestination"
        );
    });

    it("relays Polygon-to-Ethereum HospitalVerified", async () => {

        const auditService =
            createAuditService();

        const provider =
            createProvider();

        const bridge =
            createBridge(
                auditService,
                provider
            );

        const message =
            createMessage(
                "HospitalVerified",
                "msg-002",
                BlockchainType.POLYGON,
                BlockchainType.ETHEREUM
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            result.destinationTransactionHash
        ).toBe("0xdestination");

        expect(
            provider.verifyHospital
        ).toHaveBeenCalledWith(wallet);
    });

    it("relays PatientReactivated", async () => {

        const provider =
            createProvider();

        const bridge =
            createBridge(
                createAuditService(),
                provider
            );

        const message =
            createMessage(
                "PatientReactivated",
                "msg-003"
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            provider.reactivatePatient
        ).toHaveBeenCalledWith(wallet);
    });

    it("relays DoctorVerificationRevoked", async () => {

        const provider =
            createProvider();

        const bridge =
            createBridge(
                createAuditService(),
                provider
            );

        const message =
            createMessage(
                "DoctorVerificationRevoked",
                "msg-004"
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            provider.revokeDoctorVerification
        ).toHaveBeenCalledWith(wallet);
    });

    it("relays DoctorReactivated", async () => {

        const provider =
            createProvider();

        const bridge =
            createBridge(
                createAuditService(),
                provider
            );

        const message =
            createMessage(
                "DoctorReactivated",
                "msg-005"
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            provider.reactivateDoctor
        ).toHaveBeenCalledWith(wallet);
    });

    it("relays HospitalVerificationRevoked", async () => {

        const provider =
            createProvider();

        const bridge =
            createBridge(
                createAuditService(),
                provider
            );

        const message =
            createMessage(
                "HospitalVerificationRevoked",
                "msg-006"
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            provider.revokeHospitalVerification
        ).toHaveBeenCalledWith(wallet);
    });

    it("relays HospitalReactivated", async () => {

        const provider =
            createProvider();

        const bridge =
            createBridge(
                createAuditService(),
                provider
            );

        const message =
            createMessage(
                "HospitalReactivated",
                "msg-007"
            );

        const result =
            await bridge.relay(message);

        expect(result.status)
            .toBe("confirmed");

        expect(
            provider.reactivateHospital
        ).toHaveBeenCalledWith(wallet);
    });

    it("ignores unsupported events", async () => {

        const auditService =
            createAuditService();

        const provider =
            createProvider();

        const bridge =
            createBridge(
                auditService,
                provider
            );

        const message =
            createMessage(
                "RecordCreated",
                "msg-008"
            );

        const result =
            await bridge.relay(message);

        expect(result).toEqual({
            messageId: "msg-008",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            status: "ignored"
        });

        expect(
            provider.verifyDoctor
        ).not.toHaveBeenCalled();

        expect(
            auditService.markRelaying
        ).not.toHaveBeenCalled();
    });

    it("returns duplicate without relaying", async () => {

        const auditService =
            createAuditService("duplicate");

        const provider =
            createProvider();

        const bridge =
            createBridge(
                auditService,
                provider
            );

        const message =
            createMessage(
                "DoctorVerified",
                "msg-009"
            );

        const result =
            await bridge.relay(message);

        expect(result).toEqual({
            messageId: "msg-009",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            status: "duplicate"
        });

        expect(
            provider.verifyDoctor
        ).not.toHaveBeenCalled();
    });

    it("rejects identical source and destination chains", async () => {

        const auditService =
            createAuditService();

        const bridge =
            createBridge(auditService);

        const message =
            createMessage(
                "DoctorVerified",
                "msg-010",
                BlockchainType.ETHEREUM,
                BlockchainType.ETHEREUM
            );

        await expect(
            bridge.relay(message)
        ).rejects.toThrow(
            "Source and destination chains must be different"
        );

        expect(
            auditService.recordAccepted
        ).not.toHaveBeenCalled();
    });

    it("rejects Bridge as destination", async () => {

        const auditService =
            createAuditService();

        const bridge =
            createBridge(auditService);

        const message =
            createMessage(
                "DoctorVerified",
                "msg-011",
                BlockchainType.ETHEREUM,
                BlockchainType.BRIDGE
            );

        await expect(
            bridge.relay(message)
        ).rejects.toThrow(
            "Bridge cannot be used as a destination chain"
        );

        expect(
            auditService.recordAccepted
        ).not.toHaveBeenCalled();
    });

    it("marks relay as failed when destination provider throws", async () => {

        const auditService =
            createAuditService();

        const provider =
            createProvider();

        provider.verifyDoctor
            .mockRejectedValue(
                new Error("destination transaction failed")
            );

        const bridge =
            createBridge(
                auditService,
                provider
            );

        const message =
            createMessage(
                "DoctorVerified",
                "msg-012"
            );

        const result =
            await bridge.relay(message);

        expect(result).toEqual({
            messageId: "msg-012",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            status: "failed"
        });

        expect(
            auditService.markFailed
        ).toHaveBeenCalledWith(
            "msg-012",
            "destination transaction failed"
        );
    });

    it("requires eventName for a relayable message", async () => {

        const auditService =
            createAuditService();

        const bridge =
            createBridge(auditService);

        const message =
            createCrossChainMessage({
                messageId: "msg-013",
                sourceChain:
                    BlockchainType.ETHEREUM,
                destinationChain:
                    BlockchainType.POLYGON,
                messageType:
                    "blockchain.DoctorVerified",
                timestamp:
                    "2026-09-10T00:00:00.000Z",
                nonce: "msg-013",
                payload: {
                    args: [wallet]
                }
            });

        await expect(
            bridge.relay(message)
        ).rejects.toThrow(
            "Cross-chain message does not contain eventName"
        );
    });

    it("requires wallet argument for relayable events", async () => {

        const auditService =
            createAuditService();

        const bridge =
            createBridge(auditService);

        const message =
            createCrossChainMessage({
                messageId: "msg-014",
                sourceChain:
                    BlockchainType.ETHEREUM,
                destinationChain:
                    BlockchainType.POLYGON,
                messageType:
                    "blockchain.DoctorVerified",
                timestamp:
                    "2026-09-10T00:00:00.000Z",
                nonce: "msg-014",
                payload: {
                    eventName: "DoctorVerified",
                    args: []
                }
            });

        const result =
            await bridge.relay(message);

        expect(result).toEqual({
            messageId: "msg-014",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            status: "failed"
        });

        expect(
            auditService.markFailed
        ).toHaveBeenCalledWith(
            "msg-014",
            "Relayable event does not contain a wallet argument"
        );
    });
});
