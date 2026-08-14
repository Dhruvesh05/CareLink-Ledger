export interface IDID {
    createDid(alias?: string): Promise<string>;
    resolveDid(did: string): Promise<any>;
    getDid(did: string): Promise<any>;
}