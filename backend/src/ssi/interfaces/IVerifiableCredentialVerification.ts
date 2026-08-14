export interface IVerificationError {
    message: string;
    errorCode?: string;
}

export interface IVerificationResult {
    verified: boolean;
    error?: IVerificationError;
}

export interface IVerifiableCredentialVerification {
    verifyCredential(credential: string | Record<string, unknown>): Promise<IVerificationResult>;
}
