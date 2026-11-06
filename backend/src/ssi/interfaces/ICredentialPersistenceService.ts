export interface ICredentialPersistenceService {
    saveCredential(credential: Record<string, any>): Promise<string>;
    saveCredentialToIpfs(
        credential: Record<string, any>,
        userId: string,
        subjectDid: string
    ): Promise<{
        credentialId: string;
        referenceId: string;
        cid: string;
    }>;
    getCredentialFromIpfs(
        referenceId: string,
        userId: string,
        subjectDid: string
    ): Promise<Record<string, any> | null>;
    getCredential(id: string): Promise<Record<string, any> | null>;
    getCredentialsBySubject(subjectDid: string): Promise<Record<string, any>[]>;
}
