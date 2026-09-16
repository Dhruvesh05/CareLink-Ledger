import {
	IVerifyResult,
	VerifiablePresentation,
	W3CVerifiableCredential,
	W3CVerifiablePresentation,
} from "@veramo/core-types";

export interface IVerifiablePresentation {
	createPresentation(
		holderDid: string,
		credentials: W3CVerifiableCredential[],
		challenge?: string,
		domain?: string,
	): Promise<VerifiablePresentation>;
	verifyPresentation(
		presentation: W3CVerifiablePresentation,
		challenge?: string,
		domain?: string,
	): Promise<IVerifyResult>;
}
