export interface IIdentity {
    did: string;
    alias?: string;
    metadata?: Record<string, unknown>;
}
