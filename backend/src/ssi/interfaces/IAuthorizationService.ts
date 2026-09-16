export interface IAuthorizationService {
    authorize(
        did: string,
        action: string,
        verified: boolean,
        attributes: Record<string, unknown>,
    ): Promise<boolean>;
}
