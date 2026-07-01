"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, HttpClientError } from "@/lib/http-client";

export type AuthUser = {
  id: number;
  email: string;
  isVerified: boolean;
  memberSince: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  coverPositionY?: number;
  username?: string | null;
  headline?: string | null;
  currentCity?: string | null;
  hometown?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  relationshipStatus?: string | null;
  faculty: string;
  facultyId?: number | null;
  career: string;
  careerId?: number | null;
  university?: string | null;
  cycle: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  setAccessToken: (token: string) => void;
};

export const ACCESS_TOKEN_KEY = "crunedu_access_token";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)?.trim() ?? "";
}

function writeStoredToken(token: string) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

function isUnauthorizedError(error: unknown) {
  return error instanceof HttpClientError && (error.status === 401 || error.status === 403);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef("");

  const clearSession = useCallback(() => {
    tokenRef.current = "";
    writeStoredToken("");
    setAccessTokenState("");
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async (token: string) => {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await apiRequest<AuthUser>("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tokenRef.current === token) {
        setUser(currentUser);
      }

      return currentUser;
    } catch (error) {
      if (isUnauthorizedError(error) && tokenRef.current === token) {
        clearSession();
      }
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    const storedToken = readStoredToken();
    tokenRef.current = storedToken;
    setAccessTokenState(storedToken);

    async function bootstrapSession() {
      if (!storedToken) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        await loadCurrentUser(storedToken);
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, [loadCurrentUser]);

  const login = useCallback(async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      clearSession();
      return;
    }

    setIsLoading(true);
    tokenRef.current = cleanToken;
    writeStoredToken(cleanToken);
    setAccessTokenState(cleanToken);

    try {
      await loadCurrentUser(cleanToken);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, loadCurrentUser]);

  const logout = useCallback(() => {
    clearSession();
    setIsLoading(false);
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      setUser(null);
      return null;
    }

    return loadCurrentUser(token);
  }, [loadCurrentUser]);

  const setAccessToken = useCallback((token: string) => {
    void login(token);
  }, [login]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    isAuthenticated: Boolean(accessToken),
    login,
    logout,
    refreshUser,
    setAccessToken,
  }), [accessToken, isLoading, login, logout, refreshUser, setAccessToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
