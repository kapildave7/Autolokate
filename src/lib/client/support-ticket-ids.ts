"use client";

const STORAGE_KEY = "autolokate_support_ticket_ids_v1";
const MAX_IDS = 30;

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

/** Remember a ticket id after create or successful view (for list fallback when API has no collection route). */
export function rememberSupportTicketId(id: string) {
  const trimmed = String(id).trim();
  if (!trimmed) return;
  const prev = readIds();
  const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, MAX_IDS);
  writeIds(next);
}

export function getRememberedSupportTicketIds(): string[] {
  return readIds();
}
