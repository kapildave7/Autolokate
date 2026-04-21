"use client";

import { AI_ACCESS_PERIOD_DAYS } from "@/lib/constants";

export const AI_ACCESS_STORAGE_KEY = "autolokate_ai_access_v1";

/** One-shot flag: show celebration when user lands on listing AI after a successful purchase */
const AI_WELCOME_SESSION_KEY = "autolokate_ai_welcome_v1";

export function flagAiAccessWelcomeAfterPurchase(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AI_WELCOME_SESSION_KEY, "1");
  } catch {
    /* quota / private mode */
  }
}

/** Returns true once, then clears the flag (call when AI assistant mounts with valid access). */
export function consumeAiAccessWelcomeFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = sessionStorage.getItem(AI_WELCOME_SESSION_KEY);
    if (v !== "1") return false;
    sessionStorage.removeItem(AI_WELCOME_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export type StoredAiAccess = {
  v: 1;
  expiresAt: string;
  provider: "stripe" | "razorpay";
  paymentRef: string;
};

function defaultExpiresAtIso(): string {
  return new Date(Date.now() + AI_ACCESS_PERIOD_DAYS * 86400000).toISOString();
}

export function readAiAccess(): StoredAiAccess | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AI_ACCESS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredAiAccess;
    if (data?.v !== 1 || !data.expiresAt || !data.provider || !data.paymentRef) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasValidAiAccess(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_AI_ACCESS_BYPASS === "1") return true;
  const row = readAiAccess();
  if (!row) return false;
  const t = Date.parse(row.expiresAt);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

/** Call after server-confirmed payment; prefer server-provided expiresAt when available */
export function writeAiAccess(partial: {
  expiresAt?: string;
  provider: "stripe" | "razorpay";
  paymentRef: string;
}): void {
  if (typeof window === "undefined") return;
  const payload: StoredAiAccess = {
    v: 1,
    expiresAt: partial.expiresAt ?? defaultExpiresAtIso(),
    provider: partial.provider,
    paymentRef: partial.paymentRef,
  };
  localStorage.setItem(AI_ACCESS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("autolokate-ai-access-changed"));
}

export function clearAiAccess(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AI_ACCESS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("autolokate-ai-access-changed"));
}
