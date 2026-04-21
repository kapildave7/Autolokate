import type { HealthLiveness, HealthReadiness } from "@/lib/health/health-types";

const DEFAULT_BASE = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

/** Liveness — process up (GET /health, not under /v1). */
export async function fetchHealthLiveness(): Promise<HealthLiveness | null> {
  try {
    const res = await fetch(`${apiBase()}/health`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as HealthLiveness | null;
    if (!json || typeof json.status !== "string") return null;
    return json;
  } catch {
    return null;
  }
}

/** Readiness — Redis, Supabase, etc. (GET /health/ready). */
export async function fetchHealthReadiness(): Promise<HealthReadiness | null> {
  try {
    const res = await fetch(`${apiBase()}/health/ready`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as HealthReadiness | null;
    if (!json || typeof json.status !== "string") return null;
    return json;
  } catch {
    return null;
  }
}
