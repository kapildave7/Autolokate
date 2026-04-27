"use client";

export type DetailMode = "view" | "edit";

export function readDetailMode(raw: string | null): DetailMode {
  return raw === "edit" ? "edit" : "view";
}

export function isReadOnly(mode: DetailMode): boolean {
  return mode === "view";
}
