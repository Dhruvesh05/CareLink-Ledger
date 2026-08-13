export interface IVerifiableCredential {
    issueCredential(
        issuerDid: string,
        subjectDid: string,
        credentialSubject: Record<string, unknown>,
    ): Promise<any>;
}
