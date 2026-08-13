export interface IDID {
    createDid(): Promise<string>;
    resolveDid(did: string): Promise<any>;
    getDid?(did: string): Promise<any>;
}
