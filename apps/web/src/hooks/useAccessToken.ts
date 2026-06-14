"use client";

import { ACCESS_TOKEN_KEY, useAuth } from "@/providers/auth-provider";

export function getStoredAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function useAccessToken() {
  const { accessToken, isAuthenticated, setAccessToken } = useAuth();

  return {
    accessToken,
    isAuthenticated,
    setAccessToken,
  };
}
