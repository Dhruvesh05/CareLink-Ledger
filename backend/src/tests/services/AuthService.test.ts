import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { Wallet } from "ethers";

const mockUserFindOne: any = jest.fn();
const mockUserCreate: any = jest.fn();
const mockNonceCreate: any = jest.fn();
const mockNonceFindOne: any = jest.fn();
const mockNonceFindOneAndUpdate: any = jest.fn();
const mockGetRole: any = jest.fn();

jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findOne: mockUserFindOne,
        create: mockUserCreate,
    },
}));

jest.mock("../../models/AuthNonce", () => ({
    __esModule: true,
    default: {
        create: mockNonceCreate,
        findOne: mockNonceFindOne,
        findOneAndUpdate: mockNonceFindOneAndUpdate,
    },
}));

jest.mock("../../services/blockchain/BlockchainRoleService", () => ({
    BlockchainRoleService: jest.fn().mockImplementation(() => ({
        getRole: mockGetRole,
    })),
}));

jest.mock("../../utils/jwt", () => ({
    generateToken: jest.fn().mockReturnValue("test-jwt"),
}));

import { AuthService } from "../../services/AuthService";

describe("AuthService", () => {
    let service: AuthService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AuthService();
    });

    it("creates a wallet authentication challenge", async () => {
        const wallet = Wallet.createRandom();

        mockNonceCreate.mockResolvedValue({
            _id: "nonce-id",
        });

        const result = await service.createChallenge(
            wallet.address
        );

        expect(result.walletAddress).toBe(
            wallet.address.toLowerCase()
        );
        expect(result.nonce).toMatch(/^[a-f0-9]{64}$/);
        expect(result.message).toContain(
            "CareLink Ledger Authentication"
        );
        expect(result.message).toContain(
            `Wallet: ${wallet.address.toLowerCase()}`
        );

        expect(mockNonceCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                walletAddress: wallet.address.toLowerCase(),
                used: false,
                expiresAt: expect.any(Date),
            })
        );
    });

    it("rejects an invalid wallet address", async () => {
        await expect(
            service.createChallenge("not-a-wallet")
        ).rejects.toThrow("Invalid wallet address");
    });

    it("rejects a wallet signature when the challenge is missing", async () => {
        const wallet = Wallet.createRandom();

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue(null),
        });

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message: "anything",
                signature: "anything",
            })
        ).rejects.toThrow(
            "Authentication challenge not found or already used"
        );
    });

    it("rejects an expired authentication challenge", async () => {
        const wallet = Wallet.createRandom();

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue({
                _id: "nonce-id",
                nonce: "expired-nonce",
                expiresAt: new Date(Date.now() - 1000),
            }),
        });

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message: "anything",
                signature: "anything",
            })
        ).rejects.toThrow(
            "Authentication challenge has expired"
        );
    });

    it("rejects a message that does not match the stored challenge", async () => {
        const wallet = Wallet.createRandom();

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue({
                _id: "nonce-id",
                nonce: "test-nonce",
                expiresAt: new Date(Date.now() + 300000),
            }),
        });

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message: "wrong message",
                signature: "0x1234",
            })
        ).rejects.toThrow(
            "Authentication message does not match the challenge"
        );
    });

    it("rejects a signature from a different wallet", async () => {
        const wallet = Wallet.createRandom();
        const otherWallet = Wallet.createRandom();

        const expiresAt = new Date(Date.now() + 300000);

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue({
                _id: "nonce-id",
                nonce: "test-nonce",
                expiresAt,
            }),
        });

        const message = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${wallet.address.toLowerCase()}`,
            "Nonce: test-nonce",
            `Expires: ${expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        const signature =
            await otherWallet.signMessage(message);

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message,
                signature,
            })
        ).rejects.toThrow(
            "Wallet signature does not match wallet address"
        );
    });

    it("rejects a wallet without an active blockchain role", async () => {
        const wallet = Wallet.createRandom();
        const expiresAt = new Date(Date.now() + 300000);

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue({
                _id: "nonce-id",
                nonce: "test-nonce",
                expiresAt,
            }),
        });

        const message = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${wallet.address.toLowerCase()}`,
            "Nonce: test-nonce",
            `Expires: ${expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        const signature =
            await wallet.signMessage(message);

        mockGetRole.mockResolvedValue(null);

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message,
                signature,
            })
        ).rejects.toThrow(
            "Wallet does not have an active CareLink blockchain role"
        );
    });

    it("authenticates a valid wallet and consumes the nonce", async () => {
        const wallet = Wallet.createRandom();
        const expiresAt = new Date(Date.now() + 300000);

        const nonceRecord = {
            _id: "nonce-id",
            nonce: "test-nonce",
            expiresAt,
        };

        const user = {
            _id: {
                toString: () => "user-id",
            },
            walletAddress: wallet.address.toLowerCase(),
            role: "Doctor",
            active: true,
        };

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue(nonceRecord),
        });

        mockGetRole.mockResolvedValue("Doctor");

        mockUserFindOne.mockResolvedValue(user);

        mockNonceFindOneAndUpdate.mockResolvedValue({
            ...nonceRecord,
            used: true,
        });

        const message = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${wallet.address.toLowerCase()}`,
            "Nonce: test-nonce",
            `Expires: ${expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        const signature =
            await wallet.signMessage(message);

        const result =
            await service.verifyWalletSignature({
                walletAddress: wallet.address,
                message,
                signature,
            });

        expect(mockGetRole).toHaveBeenCalledWith(
            wallet.address.toLowerCase()
        );

        expect(mockNonceFindOneAndUpdate).toHaveBeenCalledWith(
            {
                _id: nonceRecord._id,
                used: false,
            },
            {
                $set: {
                    used: true,
                },
            },
            {
                new: true,
            }
        );

        expect(result).toEqual({
            token: "test-jwt",
            user: {
                id: "user-id",
                walletAddress: wallet.address.toLowerCase(),
                role: "Doctor",
            },
        });
    });

    it("rejects authentication when nonce consumption loses the race", async () => {
        const wallet = Wallet.createRandom();
        const expiresAt = new Date(Date.now() + 300000);

        mockNonceFindOne.mockReturnValue({
            sort: (jest.fn() as any).mockResolvedValue({
                _id: "nonce-id",
                nonce: "test-nonce",
                expiresAt,
            }),
        });

        mockGetRole.mockResolvedValue("Doctor");

        mockUserFindOne.mockResolvedValue({
            _id: {
                toString: () => "user-id",
            },
            walletAddress: wallet.address.toLowerCase(),
            role: "Doctor",
            active: true,
        });

        mockNonceFindOneAndUpdate.mockResolvedValue(null);

        const message = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${wallet.address.toLowerCase()}`,
            "Nonce: test-nonce",
            `Expires: ${expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        const signature =
            await wallet.signMessage(message);

        await expect(
            service.verifyWalletSignature({
                walletAddress: wallet.address,
                message,
                signature,
            })
        ).rejects.toThrow(
            "Authentication challenge has already been used"
        );
    });
});
