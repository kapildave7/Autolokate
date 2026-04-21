"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import type { GrievanceRecord } from "@/lib/client/support-api";
import { GRIEVANCE_CATEGORY_LABELS, grievanceStatusBadgeClass } from "@/components/support/grievance-ticket-display";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type Props = {
  tickets: GrievanceRecord[] | undefined;
  loading: boolean;
};

export function SupportMyTickets({ tickets, loading }: Props) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardTitle className="font-display text-lg tracking-tight">Track your tickets</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              Status updates for cases you&apos;ve raised while signed in.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-600 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading your tickets…
          </div>
        ) : !tickets?.length ? (
          <p className="py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            No tickets yet. After you submit a grievance, it will appear here with the latest status.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-muted/30 dark:bg-muted/20">
            {tickets.map((t) => {
              const cat = GRIEVANCE_CATEGORY_LABELS[t.category] ?? t.category.replace(/_/g, " ");
              return (
                <li key={t.id}>
                  <Link
                    href={`/support/${encodeURIComponent(t.id)}`}
                    className={cn(
                      "flex flex-col gap-2 px-3 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5",
                      "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-muted/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{t.subject || "Support ticket"}</p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-mono text-[0.6875rem] text-slate-800 dark:text-slate-200">{t.id}</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span>{cat}</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span>Updated {formatUpdated(t.updated_at)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                          grievanceStatusBadgeClass(t.status)
                        )}
                      >
                        {t.status.replace(/_/g, " ")}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
