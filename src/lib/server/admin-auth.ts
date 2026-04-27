import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_KEY } from "@/lib/auth/constants";

type AuthMeResponse = {
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

function getApiBaseUrl(): string {
  const fallback = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? fallback).replace(/\/$/, "");
}

export async function requireAdminAccess() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  if (!accessToken) {
    redirect("/admin");
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/admin");
  }

  const payload = (await response.json().catch(() => null)) as AuthMeResponse | null;
  return payload;
}
