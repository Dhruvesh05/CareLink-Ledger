import UserModel from "../models/User";
import IdentityService from "../ssi/services/IdentityService";

export class UserDidError extends Error {
    constructor(
        message: string,
        public readonly status = 500
    ) {
        super(message);
        this.name = "UserDidError";
    }
}

export class UserDidService {
    async createOrLoadDid(userId: string): Promise<string> {
        const user = await this.findUser(userId);

        if (user.did) {
            return user.did;
        }

        const identity = await IdentityService.createIdentity(
            `carelink-user-${user._id.toString()}`
        );

        const updatedUser = await UserModel.findOneAndUpdate(
            {
                _id: user._id,
                $or: [
                    { did: { $exists: false } },
                    { did: null },
                    { did: "" }
                ]
            },
            { $set: { did: identity.did } },
            { new: true }
        );

        if (updatedUser?.did) {
            return updatedUser.did;
        }

        const persistedUser = await this.findUser(userId);
        if (persistedUser.did) {
            return persistedUser.did;
        }

        throw new UserDidError(
            "Failed to persist DID for authenticated user"
        );
    }

    async getDid(userId: string): Promise<string> {
        const user = await this.findUser(userId);

        if (!user.did) {
            throw new UserDidError(
                "Authenticated user does not have a DID",
                404
            );
        }

        return user.did;
    }

    private async findUser(userId: string) {
        if (!userId || typeof userId !== "string") {
            throw new UserDidError(
                "Authenticated user is required",
                401
            );
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            throw new UserDidError(
                "Authenticated user not found",
                404
            );
        }

        return user;
    }
}

export default UserDidService;