// src/lib/hooks/useAuth.ts
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { getUserFromAuthResult } from "@/lib/auth-session";
import { navigateTo } from "@/lib/navigation";

type AuthContextValue = {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession?: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const result = await authClient.getSession();
    setUser(getUserFromAuthResult(result));
  }, []);

  useEffect(() => {
    refreshSession()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message);
    setUser(getUserFromAuthResult(result));
    navigateTo("/dashboard");
  };

  const signup = async (name: string, email: string, password: string) => {
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) throw new Error(result.error.message);
    setUser(getUserFromAuthResult(result));
    navigateTo("/dashboard");
  };

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
    navigateTo("/");
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshSession,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
