import { apiPost, type ApiError } from "./client";

export type UserRole = "Admin" | "Patient" | "Doctor" | "Hospital";

export interface AuthUser {
  id: string;
  walletAddress: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthChallengeResponse {
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
}

const STORAGE_KEY = "carelink_auth";
const VALID_ROLES: UserRole[] = ["Admin", "Patient", "Doctor", "Hospital"];

function hasValidToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !hasValidToken(parsed.token) || !parsed?.user?.walletAddress || !VALID_ROLES.includes(parsed.user.role)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getToken(): string | null {
  return getStoredSession()?.token ?? null;
}

export async function requestChallenge(walletAddress: string): Promise<AuthChallengeResponse> {
  const payload = await apiPost<{ data: AuthChallengeResponse }>("/auth/challenge", { walletAddress });
  return payload.data ?? payload;
}

export async function verifyChallenge(walletAddress: string, message: string, signature: string): Promise<AuthSession> {
  const payload = await apiPost<{ data: { token: string; user: AuthUser } }>("/auth/verify", {
    walletAddress,
    message,
    signature,
  });

  const data = payload.data ?? payload;
  if (!data?.token || !data.user) {
    throw new Error("Authentication response was incomplete");
  }

  return {
    token: data.token,
    user: data.user,
  };
}

export function isAuthError(error: unknown): error is ApiError {
  return error instanceof Error && "status" in error;
}
