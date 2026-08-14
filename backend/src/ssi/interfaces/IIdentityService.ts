import { IIdentity } from "./IIdentity";

export interface IIdentityService {
    createIdentity(alias?: string): Promise<IIdentity>;
    getIdentityByDid(did: string): Promise<IIdentity | null>;
    getIdentities(): Promise<IIdentity[]>;
}
