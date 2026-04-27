"use client";

import {
  ACCESS_TOKEN_COOKIE_KEY,
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_COOKIE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/auth/constants";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readAuthTokens(): AuthTokens | null {
  if (!canUseStorage()) return null;
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export function writeAuthTokens(tokens: AuthTokens): void {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=${encodeURIComponent(tokens.accessToken)}; path=/; max-age=2592000; samesite=lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE_KEY}=${encodeURIComponent(tokens.refreshToken)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearAuthTokens(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function hasAuthTokens(): boolean {
  const tokens = readAuthTokens();
  return Boolean(tokens?.accessToken && tokens?.refreshToken);
}
