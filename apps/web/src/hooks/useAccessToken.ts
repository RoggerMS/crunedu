"use client";

import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "crunedu_access_token";

function readStoredAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function useAccessToken() {
  const [accessToken, setAccessTokenState] = useState("");

  useEffect(() => {
    setAccessTokenState(readStoredAccessToken());
  }, []);

  const setAccessToken = useCallback((token: string) => {
    const cleanToken = token.trim();

    if (typeof window !== "undefined") {
      if (cleanToken.length === 0) {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      } else {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, cleanToken);
      }
    }

    setAccessTokenState(cleanToken);
  }, []);

  return {
    accessToken,
    isAuthenticated: accessToken.length > 0,
    setAccessToken,
  };
}
