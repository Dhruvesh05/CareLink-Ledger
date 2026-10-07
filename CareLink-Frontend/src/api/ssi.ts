import { apiGet, apiPost } from "./client";
import { getToken } from "./auth";

export interface DidResponse {
  did: string;
}

export interface SsiAuthorizationChallenge {
  challenge: string;
  expiresAt: string;
}

export interface SsiAuthorizationPresentation {
  presentation: Record<string, unknown>;
}

export async function getAuthenticatedDid(): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication is required for identity verification.");
  }

  const response = await apiGet<DidResponse>("/identity/did", token);
  if (!response?.did) {
    throw new Error("The backend did not return a CareLink DID.");
  }

  return response.did;
}

export async function requestSsiAuthorizationChallenge(): Promise<SsiAuthorizationChallenge> {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication is required for identity verification.");
  }

  const response = await apiPost<SsiAuthorizationChallenge>(
    "/identity/authorization-challenge",
    {},
    token
  );

  if (!response?.challenge || !response.expiresAt) {
    throw new Error("The backend returned an incomplete SSI challenge.");
  }

  return response;
}

export async function createSsiAuthorizationPresentation(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication is required for identity verification.");
  }

  const response = await apiPost<SsiAuthorizationPresentation>(
    "/identity/authorization-presentation",
    {},
    token
  );

  if (!response?.presentation) {
    throw new Error("The backend did not return an authorization proof.");
  }

  return response.presentation;
}

export async function verifySsiAuthorization(
  presentation: Record<string, unknown>
): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication is required for identity verification.");
  }

  await apiPost(
    "/identity/authorization",
    { presentation },
    token
  );
}
