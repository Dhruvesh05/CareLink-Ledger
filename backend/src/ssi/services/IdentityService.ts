export interface IdentityService {
	createIdentity(
		...args: unknown[]
	): Promise<unknown>;

	resolveIdentity(
		...args: unknown[]
	): Promise<unknown>;

	verifyIdentity(
		...args: unknown[]
	): Promise<boolean>;
}

export class DefaultIdentityService
	implements IdentityService {

	async createIdentity(
		..._args: unknown[]
	): Promise<unknown> {
		throw new Error(
			"SSI IdentityService is not implemented yet"
		);
	}

	async resolveIdentity(
		..._args: unknown[]
	): Promise<unknown> {
		throw new Error(
			"SSI IdentityService is not implemented yet"
		);
	}

	async verifyIdentity(
		..._args: unknown[]
	): Promise<boolean> {
		throw new Error(
			"SSI IdentityService is not implemented yet"
		);
	}
}