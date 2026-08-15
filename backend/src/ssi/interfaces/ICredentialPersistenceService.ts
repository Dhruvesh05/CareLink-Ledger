export interface ICredentialPersistenceService {
    saveCredential(credential: Record<string, any>): Promise<string>;
    getCredential(id: string): Promise<Record<string, any> | null>;
    getCredentialsBySubject(subjectDid: string): Promise<Record<string, any>[]>;
}
