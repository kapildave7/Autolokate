"use client";

import { readAuthTokens, writeAuthTokens } from "@/lib/client/auth-storage";

const DEFAULT_API_BASE_URL = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: JsonValue;
  auth?: boolean;
  retryOnAuthFailure?: boolean;
  /** Passed to `fetch` — cancels the request when aborted (e.g. variant/city changed). */
  signal?: AbortSignal;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as T | { message?: string; error?: string } | null;
  if (!response.ok) {
    const message =
      (payload as { message?: string; error?: string } | null)?.message ||
      (payload as { message?: string; error?: string } | null)?.error ||
      "Request failed";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = readAuthTokens();
  if (!tokens?.refreshToken) return null;

  const response = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refreshToken }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as
    | { access_token?: string; data?: { access_token?: string } }
    | null;
  const nextAccessToken = payload?.access_token ?? payload?.data?.access_token;
  if (!nextAccessToken) return null;
  writeAuthTokens({
    accessToken: nextAccessToken,
    refreshToken: tokens.refreshToken,
  });
  return nextAccessToken;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, retryOnAuthFailure = true, signal } = options;
  const tokens = readAuthTokens();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (auth && tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 401 && auth && retryOnAuthFailure) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiRequest<T>(path, { ...options, retryOnAuthFailure: false });
    }
  }

  return parseResponse<T>(response);
}
