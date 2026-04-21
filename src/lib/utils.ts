import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(n: number): string {
  // NBSP before unit so "₹11.95" and "Lakh" stay on one line when wrapping.
  const nbsp = "\u00A0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}${nbsp}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}${nbsp}Lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Engine size in cc — plain integer, no Indian-style grouping (1199 cc not 1,199 cc). */
export function formatEngineDisplacementCc(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  const raw = typeof value === "number" ? value : String(value).replace(/,/g, "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  return `${Math.round(n)} cc`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Two-letter mark from partner name (e.g. "Spin City Motors" → "SC"). */
export function partnerMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 2) {
    const a = words[0][0] ?? "";
    const b = words[1][0] ?? "";
    return (a + b).toUpperCase();
  }
  const w = words[0] ?? "";
  if (w.length >= 2) return w.slice(0, 2).toUpperCase();
  return (w[0] ?? "?").toUpperCase();
}
