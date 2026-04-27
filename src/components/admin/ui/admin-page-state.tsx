"use client";

import { Loader2 } from "lucide-react";

export function AdminLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center text-sm text-zinc-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-600" />
      {label}
    </div>
  );
}

export function AdminEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-purple-200 py-14 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}
