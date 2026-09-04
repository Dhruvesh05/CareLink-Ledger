import bcrypt from "bcrypt";
import { isAddress } from "ethers";

import UserModel, {
    IUser,
    UserRole
} from "../models/User";

import {
    AuthTokenPayload,
    generateToken
} from "../utils/jwt";

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

const PASSWORD_SALT_ROUNDS = 12;

export class AuthService {
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

    isImplemented() {
        return true;
    }
}
