import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearSession, getStoredSession, saveSession, type AuthSession, type UserRole } from "../api/auth";

interface AuthContextValue {
  session: AuthSession | null;
  token: string | null;
  user: AuthSession["user"] | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  restoreSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(() => {
    const stored = getStoredSession();
    setSession(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearSession();
      setSession(null);
    };

    window.addEventListener("carelink:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("carelink:auth-expired", handleExpiredSession);
  }, []);

  const login = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    token: session?.token ?? null,
    user: session?.user ?? null,
    role: session?.user.role ?? null,
    isAuthenticated: Boolean(session),
    isLoading,
    login,
    logout,
    restoreSession,
  }), [isLoading, login, logout, restoreSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getDashboardPathByRole(role: UserRole | null): string {
  switch (role) {
    case "Patient":
      return "/patient-dashboard";
    case "Doctor":
      return "/doctor/dashboard";
    case "Hospital":
      return "/hospital/dashboard";
    case "Admin":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}
