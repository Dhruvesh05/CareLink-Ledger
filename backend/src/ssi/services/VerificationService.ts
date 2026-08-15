export interface VerificationService {
	verifyCredential(
		...args: unknown[]
	): Promise<boolean>;

	verifyPresentation(
		...args: unknown[]
	): Promise<boolean>;
}

export class DefaultVerificationService
	implements VerificationService {

	async verifyCredential(
		..._args: unknown[]
	): Promise<boolean> {
		throw new Error(
			"SSI VerificationService is not implemented yet"
		);
	}

	async verifyPresentation(
		..._args: unknown[]
	): Promise<boolean> {
		throw new Error(
			"SSI VerificationService is not implemented yet"
		);
	}
}