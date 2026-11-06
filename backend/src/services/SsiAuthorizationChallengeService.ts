import { randomBytes } from "crypto";

import SsiAuthorizationChallengeModel from "../models/SsiAuthorizationChallenge";

export interface SsiAuthorizationChallenge {
    challengeId: string;
    challenge: string;
    expiresAt: Date;
}

export const SSI_AUTHORIZATION_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export class SsiAuthorizationChallengeService {
    async createChallenge(
        userId: string
    ): Promise<SsiAuthorizationChallenge> {
        this.requireUserId(userId);

        const challenge = randomBytes(32).toString("hex");
        const expiresAt = new Date(
            Date.now() + SSI_AUTHORIZATION_CHALLENGE_TTL_MS
        );

        const record = await SsiAuthorizationChallengeModel.create({
            userId,
            challenge,
            expiresAt,
            used: false
        });

        return {
            challengeId: String(record._id),
            challenge,
            expiresAt
        };
    }

    async getChallenge(
        userId: string,
        challengeId: string
    ): Promise<SsiAuthorizationChallenge | null> {
        this.requireUserId(userId);
        if (typeof challengeId !== "string" || !challengeId.trim()) {
            return null;
        }

        const record = await SsiAuthorizationChallengeModel.findOne({
            _id: challengeId.trim(),
            userId,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!record) {
            return null;
        }

        return {
            challengeId: String(record._id),
            challenge: record.challenge,
            expiresAt: record.expiresAt
        };
    }

    async getPendingChallenge(
        userId: string
    ): Promise<SsiAuthorizationChallenge | null> {
        this.requireUserId(userId);

        const record = await SsiAuthorizationChallengeModel.findOne({
            userId,
            used: false,
            expiresAt: { $gt: new Date() }
        }).sort({
            createdAt: -1
        });

        if (!record) {
            return null;
        }

        return {
            challengeId: String(record._id),
            challenge: record.challenge,
            expiresAt: record.expiresAt
        };
    }

    async consumeChallenge(
        userId: string,
        challengeId: string
    ): Promise<boolean> {
        if (
            typeof userId !== "string" ||
            !userId.trim() ||
            typeof challengeId !== "string" ||
            !challengeId.trim()
        ) {
            return false;
        }

        const consumed =
            await SsiAuthorizationChallengeModel.findOneAndUpdate(
                {
                    userId,
                    _id: challengeId.trim(),
                    used: false,
                    expiresAt: { $gt: new Date() }
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

        return Boolean(consumed);
    }

    private requireUserId(userId: string): void {
        if (typeof userId !== "string" || !userId.trim()) {
            throw new Error("Authenticated user is required");
        }
    }
}

export default new SsiAuthorizationChallengeService();