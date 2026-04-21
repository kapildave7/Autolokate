"use client";

import type { HealthLiveness, HealthReadiness } from "@/lib/health/health-types";

const DEFAULT_BASE = "https://autolokate-api-staging-2j5tqz76xa-el.a.run.app";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTOLOKATE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
}

/** Browser / client: GET /health (no auth). */
export async function getHealthLiveness(): Promise<HealthLiveness | null> {
  try {
    const res = await fetch(`${apiBase()}/health`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as HealthLiveness;
  } catch {
    return null;
  }
}

/** Browser / client: GET /health/ready (no auth). */
export async function getHealthReadiness(): Promise<HealthReadiness | null> {
  try {
    const res = await fetch(`${apiBase()}/health/ready`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as HealthReadiness;
  } catch {
    return null;
  }
}
