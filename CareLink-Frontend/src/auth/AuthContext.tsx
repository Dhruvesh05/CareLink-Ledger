import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, getStoredSession, saveSession, type AuthSession, type UserRole } from "../api/auth";
import { getMyProfile, type UserProfile } from "../api/profile";

interface AuthContextValue {
  session: AuthSession | null;
  token: string | null;
  user: AuthSession["user"] | null;
  role: UserRole | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  restoreSession: () => void;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(() => {
    setSession(getStoredSession());
    setProfile(null);
    setIsLoading(false);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!session?.token) { setProfile(null); return null; }
    try {
      const latest = await getMyProfile(session.token);
      setProfile(latest);
      return latest;
    } catch (error) {
      console.error("[profile] Unable to refresh profile:", error);
      return null;
    }
  }, [session?.token]);

  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => {
    if (session?.token) void refreshProfile();
    else setProfile(null);
  }, [session?.token, refreshProfile]);
  useEffect(() => {
    const handleExpiredSession = () => { clearSession(); setSession(null); setProfile(null); };
    window.addEventListener("carelink:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("carelink:auth-expired", handleExpiredSession);
  }, []);

  const login = useCallback((next: AuthSession) => { saveSession(next); setProfile(null); setSession(next); }, []);
  const logout = useCallback(() => { clearSession(); setSession(null); setProfile(null); }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, token: session?.token ?? null, user: session?.user ?? null,
    role: session?.user.role ?? null, profile, isAuthenticated: Boolean(session),
    isLoading, login, logout, restoreSession, refreshProfile,
  }), [isLoading, login, logout, profile, refreshProfile, restoreSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getDashboardPathByRole(role: UserRole | null): string {
  switch (role) {
    case "Patient": return "/patient-dashboard";
    case "Doctor": return "/doctor/dashboard";
    case "Hospital": return "/hospital/dashboard";
    case "Admin": return "/admin/dashboard";
    default: return "/login";
  }
}
