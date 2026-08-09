# SSI (Self-Sovereign Identity) Module

Purpose
 - Provide the SSI foundation for the backend using Veramo.

Why Veramo
 - Veramo is a modular agent framework for DIDs, keys, and verifiable credentials.

Current Architecture
 - `createAgent()` builds a single reusable Veramo agent composed of:
	 - Key Manager
	 - DID Manager (with `did:key` provider)
	 - DID Resolver (did:key)

Why `did:key` initially
 - `did:key` is self-contained (no external registry) and suitable for local development and tests.

What is implemented
 - Veramo configuration (`config/veramo.config.ts`) reading minimal env values.
 - Agent factory (`agent/createAgent.ts`) that composes an agent with key + DID + resolver plugins.
 - Unit tests that validate agent creation and basic did:key create/resolve flow (mocks Veramo internals).

Limitations / Next steps
 - This is the foundation only. No credentials, presentations, authentication, or blockchain DID integration yet.
 - Future work: persistent key/credential stores, DID methods (Polygon DID), CredentialService, VerificationService, IdentityService.
