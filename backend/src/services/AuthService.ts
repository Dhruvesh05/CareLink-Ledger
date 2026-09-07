import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import {
    isAddress,
    verifyMessage
} from "ethers";

import UserModel, {
    IUser,
    UserRole
} from "../models/User";

import AuthNonceModel from "../models/AuthNonce";

import {
    AuthTokenPayload,
    generateToken
} from "../utils/jwt";

import {
    BlockchainRoleService
} from "./blockchain/BlockchainRoleService";

export interface RegisterInput {
    walletAddress: string;
    password: string;
    role: UserRole;
}

export interface LoginInput {
    walletAddress: string;
    password: string;
}

export interface AuthResult {
    token: string;
    user: {
        id: string;
        walletAddress: string;
        role: UserRole;
    };
}

export interface AuthChallenge {
    walletAddress: string;
    nonce: string;
    message: string;
    expiresAt: Date;
}

export interface VerifyWalletInput {
    walletAddress: string;
    message: string;
    signature: string;
}

const PASSWORD_SALT_ROUNDS = 12;

export class AuthService {

    private readonly blockchainRoleService =
        new BlockchainRoleService();

    async register(
        input: RegisterInput
    ): Promise<AuthResult> {
        const walletAddress = input.walletAddress
            .trim()
            .toLowerCase();

        if (!isAddress(walletAddress)) {
            throw new Error("Invalid wallet address");
        }

        if (
            typeof input.password !== "string" ||
            input.password.length < 8
        ) {
            throw new Error(
                "Password must be at least 8 characters"
            );
        }

        const existingUser = await UserModel.findOne({
            walletAddress
        });

        if (existingUser) {
            throw new Error(
                "User with this wallet address already exists"
            );
        }

        const passwordHash = await bcrypt.hash(
            input.password,
            PASSWORD_SALT_ROUNDS
        );

        const user = await UserModel.create({
            walletAddress,
            role: input.role,
            passwordHash,
            active: true
        });

        return this.createAuthResult(user);
    }

    async login(
        input: LoginInput
    ): Promise<AuthResult> {
        const walletAddress = input.walletAddress
            .trim()
            .toLowerCase();

        if (!isAddress(walletAddress)) {
            throw new Error("Invalid wallet address");
        }

        const user = await UserModel.findOne({
            walletAddress
        }).select("+passwordHash");

        if (!user) {
            throw new Error(
                "Invalid wallet address or password"
            );
        }

        if (!user.active) {
            throw new Error("User account is inactive");
        }

        if (!user.passwordHash) {
            throw new Error(
                "Password authentication is not enabled for this user"
            );
        }

        const passwordMatches = await bcrypt.compare(
            input.password,
            user.passwordHash
        );

        if (!passwordMatches) {
            throw new Error(
                "Invalid wallet address or password"
            );
        }

        return this.createAuthResult(user);
    }

    private createAuthResult(
        user: IUser
    ): AuthResult {
        const payload: AuthTokenPayload = {
            userId: user._id.toString(),
            walletAddress: user.walletAddress,
            role: user.role
        };

        const token = generateToken(payload);

        return {
            token,
            user: {
                id: user._id.toString(),
                walletAddress: user.walletAddress,
                role: user.role
            }
        };
    }

    async createChallenge(
        walletAddressInput: string
    ): Promise<AuthChallenge> {
        const walletAddress =
            walletAddressInput.trim().toLowerCase();

        if (!isAddress(walletAddress)) {
            throw new Error("Invalid wallet address");
        }

        const nonce = randomBytes(32).toString("hex");

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        const message = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${walletAddress}`,
            `Nonce: ${nonce}`,
            `Expires: ${expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        await AuthNonceModel.create({
            walletAddress,
            nonce,
            expiresAt,
            used: false
        });

        return {
            walletAddress,
            nonce,
            message,
            expiresAt
        };
    }

    async verifyWalletSignature(
        input: VerifyWalletInput
    ): Promise<AuthResult> {

        const walletAddress =
            input.walletAddress
                .trim()
                .toLowerCase();

        if (!isAddress(walletAddress)) {
            throw new Error("Invalid wallet address");
        }

        if (
            typeof input.message !== "string" ||
            !input.message.trim()
        ) {
            throw new Error(
                "Authentication message is required"
            );
        }

        if (
            typeof input.signature !== "string" ||
            !input.signature.trim()
        ) {
            throw new Error(
                "Signature is required"
            );
        }

        const nonceRecord =
            await AuthNonceModel.findOne({
                walletAddress,
                used: false
            }).sort({
                createdAt: -1
            });

        if (!nonceRecord) {
            throw new Error(
                "Authentication challenge not found or already used"
            );
        }

        if (
            nonceRecord.expiresAt.getTime() <=
            Date.now()
        ) {
            throw new Error(
                "Authentication challenge has expired"
            );
        }

        const expectedMessage = [
            "CareLink Ledger Authentication",
            "",
            `Wallet: ${walletAddress}`,
            `Nonce: ${nonceRecord.nonce}`,
            `Expires: ${nonceRecord.expiresAt.toISOString()}`,
            "",
            "Sign this message to authenticate with CareLink Ledger."
        ].join("\n");

        if (input.message !== expectedMessage) {
            throw new Error(
                "Authentication message does not match the challenge"
            );
        }

        let recoveredAddress: string;

        try {
            recoveredAddress =
                verifyMessage(
                    input.message,
                    input.signature
                ).toLowerCase();
        } catch {
            throw new Error(
                "Invalid wallet signature"
            );
        }

        if (
            recoveredAddress !== walletAddress
        ) {
            throw new Error(
                "Wallet signature does not match wallet address"
            );
        }

        const blockchainRole =
            await this.blockchainRoleService.getRole(
                walletAddress
            );

        if (!blockchainRole) {
            throw new Error(
                "Wallet does not have an active CareLink blockchain role"
            );
        }

        const role =
            blockchainRole as UserRole;

        let user =
            await UserModel.findOne({
                walletAddress
            });

        if (!user) {
            user = await UserModel.create({
                walletAddress,
                role,
                active: true
            });
        } else {

            if (!user.active) {
                throw new Error(
                    "User account is inactive"
                );
            }

            if (user.role !== role) {
                user.role = role;
                await user.save();
            }
        }

        const consumedNonce =
            await AuthNonceModel.findOneAndUpdate(
                {
                    _id: nonceRecord._id,
                    used: false
                },
                {
                    $set: {
                        used: true
                    }
                },
                {
                    new: true
                }
            );

        if (!consumedNonce) {
            throw new Error(
                "Authentication challenge has already been used"
            );
        }

        return this.createAuthResult(user);
    }

    isImplemented() {
        return true;
    }
}
