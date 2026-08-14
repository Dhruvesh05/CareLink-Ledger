import veramoConfig from "../config/veramo.config";

type AnyAgent = any;

let singletonAgent: AnyAgent | null = null;

export async function createAgent(): Promise<AnyAgent> {
    if (singletonAgent) return singletonAgent;

    // Dynamically import Veramo components
    const [{ Agent }, { KeyManager }, dataStore, kmsLocalModule, { DIDManager }, didProviderKey, { DIDResolverPlugin }, credentialW3c, credentialJwt] =
        await Promise.all([
            import("@veramo/core"),
            import("@veramo/key-manager"),
            import("@veramo/data-store"),
            import("@veramo/kms-local"),
            import("@veramo/did-manager"),
            import("@veramo/did-provider-key"),
            import("@veramo/did-resolver"),
            import("@veramo/credential-w3c"),
            import("@veramo/credential-jwt"),
        ]);

    const { KeyStore, PrivateKeyStore, DIDStore, DataStore, DataStoreORM, Entities } = dataStore as any;
    const { KeyManagementSystem, SecretBox } = kmsLocalModule as any;
    const { getDidKeyResolver, KeyDIDProvider } = didProviderKey as any;
    const { CredentialPlugin } = credentialW3c as any;
    const { CredentialProviderJWT } = credentialJwt as any;

    // TypeORM DataSource
    const { DataSource } = await import("typeorm");

    // ensure secret key is available for encrypting private keys
    if (!veramoConfig.secretKey) {
        throw new Error("SSI secret key is not configured. Set SSI_SECRET_KEY in environment.");
    }

    // create TypeORM data source using Veramo entities
    const dataSource = new DataSource({
        // some TypeORM versions use 'better-sqlite3' in the type union; cast to any
        type: ("better-sqlite3" as any),
        database: veramoConfig.database || ":memory:",
        synchronize: true,
        logging: false,
        entities: Entities,
    });

    await dataSource.initialize();

    // stores
    const keyStore = new KeyStore(dataSource);
    const secretBox = new SecretBox(veramoConfig.secretKey!);
    const privateKeyStore = new PrivateKeyStore(dataSource, secretBox);
    const didStore = new DIDStore(dataSource);

    // KMS local
    const kmsLocal = new KeyManagementSystem(privateKeyStore);

    // Key manager plugin
    const keyManager = new KeyManager({ store: keyStore, kms: { local: kmsLocal } });

    // DID manager with did:key provider
    const keyDidProvider = new KeyDIDProvider({ defaultKms: "local" });
    const didManager = new DIDManager({ providers: { "did:key": keyDidProvider }, defaultProvider: "did:key", store: didStore });

    // DID resolver plugin
    const resolverMap = getDidKeyResolver();
    // getDidKeyResolver() returns a map { key: resolverFunction } which matches
    // the DIDResolverPlugin constructor overload that accepts a map of DID method resolvers.
    const didResolverPlugin = new DIDResolverPlugin(resolverMap as any);

    // DataStore plugin for VC/VP persistence, and DataStore ORM plugin for query helpers.
    const dataStorePlugin = new DataStore(dataSource);
    const dataStoreOrm = new DataStoreORM(dataSource);

    // Credential plugin with the JWT proof provider required for signed W3C VCs.
    const credentialPlugin = new CredentialPlugin([new CredentialProviderJWT()]);

    // compose agent
    singletonAgent = new Agent({
        plugins: [keyManager, didManager, didResolverPlugin, dataStorePlugin, dataStoreOrm, credentialPlugin],
    });

    return singletonAgent;
}

export default createAgent;
