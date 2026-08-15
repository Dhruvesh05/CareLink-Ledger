import veramoConfig from "../config/veramo.config";

type AnyAgent = any;

let singletonAgent: AnyAgent | null = null;

/**
 * Loads Veramo dependencies.
 *
 * Kept in a separate function so the agent construction logic
 * remains isolated and easier to test.
 */
async function loadVeramoDependencies() {
    const [
        core,
        keyManagerModule,
        dataStore,
        kmsLocalModule,
        didManagerModule,
        didProviderKey,
        didResolverModule,
        credentialW3c,
        credentialJwt,
    ] = await Promise.all([
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

    return {
        core,
        keyManagerModule,
        dataStore,
        kmsLocalModule,
        didManagerModule,
        didProviderKey,
        didResolverModule,
        credentialW3c,
        credentialJwt,
    };
}

export async function createAgent(): Promise<AnyAgent> {
    // Reuse the existing agent when already initialized.
    if (singletonAgent) {
        return singletonAgent;
    }

    const {
        core,
        keyManagerModule,
        dataStore,
        kmsLocalModule,
        didManagerModule,
        didProviderKey,
        didResolverModule,
        credentialW3c,
        credentialJwt,
    } = await loadVeramoDependencies();

    const { Agent } = core;
    const { KeyManager } = keyManagerModule;

    const {
        KeyStore,
        PrivateKeyStore,
        DIDStore,
        DataStore,
        DataStoreORM,
        Entities,
    } = dataStore as any;

    const {
        KeyManagementSystem,
        SecretBox,
    } = kmsLocalModule as any;

    const {
        DIDManager,
    } = didManagerModule;

    const {
        getDidKeyResolver,
        KeyDIDProvider,
    } = didProviderKey as any;

    const {
        DIDResolverPlugin,
    } = didResolverModule;

    const {
        CredentialPlugin,
    } = credentialW3c as any;

    const {
        CredentialProviderJWT,
    } = credentialJwt as any;

    // TypeORM DataSource
    const { DataSource } = await import("typeorm");

    // Ensure the SSI secret key exists.
    if (!veramoConfig.secretKey) {
        throw new Error(
            "SSI secret key is not configured. Set SSI_SECRET_KEY in environment."
        );
    }

    // Create TypeORM data source using Veramo entities.
    const dataSource = new DataSource({
        type: "better-sqlite3" as any,
        database: veramoConfig.database || ":memory:",
        synchronize: true,
        logging: false,
        entities: Entities,
    });

    await dataSource.initialize();

    // ------------------------------------------------------------------
    // Stores
    // ------------------------------------------------------------------

    const keyStore = new KeyStore(dataSource);

    const secretBox = new SecretBox(
        veramoConfig.secretKey
    );

    const privateKeyStore = new PrivateKeyStore(
        dataSource,
        secretBox
    );

    const didStore = new DIDStore(
        dataSource
    );

    // ------------------------------------------------------------------
    // Local Key Management System
    // ------------------------------------------------------------------

    const kmsLocal = new KeyManagementSystem(
        privateKeyStore
    );

    // ------------------------------------------------------------------
    // Key Manager
    // ------------------------------------------------------------------

    const keyManager = new KeyManager({
        store: keyStore,
        kms: {
            local: kmsLocal,
        },
    });

    // ------------------------------------------------------------------
    // DID Manager
    // ------------------------------------------------------------------

    const keyDidProvider = new KeyDIDProvider({
        defaultKms: "local",
    });

    const didManager = new DIDManager({
        providers: {
            "did:key": keyDidProvider,
        },
        defaultProvider: "did:key",
        store: didStore,
    });

    // ------------------------------------------------------------------
    // DID Resolver
    // ------------------------------------------------------------------

    const resolverMap = getDidKeyResolver();

    const didResolverPlugin =
        new DIDResolverPlugin(
            resolverMap as any
        );

    // ------------------------------------------------------------------
    // Data Store
    // ------------------------------------------------------------------

    const dataStorePlugin =
        new DataStore(dataSource);

    const dataStoreOrm =
        new DataStoreORM(dataSource);

    // ------------------------------------------------------------------
    // Credential / W3C VC support
    // ------------------------------------------------------------------

    const credentialPlugin =
        new CredentialPlugin([
            new CredentialProviderJWT(),
        ]);

    // ------------------------------------------------------------------
    // Compose Veramo Agent
    // ------------------------------------------------------------------

    singletonAgent = new Agent({
        plugins: [
            keyManager,
            didManager,
            didResolverPlugin,
            dataStorePlugin,
            dataStoreOrm,
            credentialPlugin,
        ],
    });

    return singletonAgent;
}

export default createAgent;