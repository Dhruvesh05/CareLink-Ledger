import { deployCareLink } from "./deploy";

let cachedDeployment: Awaited<ReturnType<typeof deployCareLink>> | null = null;

/**
 * Returns a shared deployment for the current test file.
 * The first call deploys all contracts.
 * Subsequent calls reuse the same deployment.
 */
export async function loadFixture() {
    if (!cachedDeployment) {
        cachedDeployment = await deployCareLink();
    }

    return cachedDeployment;
}

/**
 * Clears the cached deployment.
 * Useful if a test suite needs a completely fresh deployment.
 */
export function resetFixture() {
    cachedDeployment = null;
}