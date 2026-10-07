export interface IVerifiableCredential {
    issueCredential(
        issuerDid: string,
        subjectDid: string,
        credentialSubject: Record<string, unknown>,
        credentialTypes?: string[],
    ): Promise<any>;
}
