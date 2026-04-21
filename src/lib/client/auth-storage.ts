"use client";

const ACCESS_TOKEN_KEY = "autolokate_access_token";
const REFRESH_TOKEN_KEY = "autolokate_refresh_token";

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
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export function writeAuthTokens(tokens: AuthTokens): void {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthTokens(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  // localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasAuthTokens(): boolean {
  const tokens = readAuthTokens();
  return Boolean(tokens?.accessToken && tokens?.refreshToken);
}
