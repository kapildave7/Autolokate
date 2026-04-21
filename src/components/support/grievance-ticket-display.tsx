"use client";

import { useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";
import { toast } from "sonner";
import type { GrievanceRecord } from "@/lib/client/support-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const GRIEVANCE_CATEGORY_LABELS: Record<string, string> = {
  account: "Account",
  data_privacy: "Data & privacy",
  payment: "Payment",
  booking: "Booking",
  general: "General",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Shared with compact ticket rows (e.g. support home list). */
export function grievanceStatusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "open" || s === "pending") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
  if (s === "resolved" || s === "closed") return "border-border bg-muted text-muted-foreground";
  if (s === "in_progress") return "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100";
  return "border-border bg-secondary text-secondary-foreground";
}

type Props = {
  ticket: GrievanceRecord;
  /** Success screen after POST — tighter hero copy */
  variant?: "success" | "detail";
  className?: string;
};

export function GrievanceTicketDisplay({ ticket, variant = "detail", className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(ticket.id);
      setCopied(true);
      toast.success("Ticket ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  const categoryLabel = GRIEVANCE_CATEGORY_LABELS[ticket.category] ?? ticket.category.replace(/_/g, " ");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-24px_rgba(15,23,42,0.25)]",
        className
      )}
    >
      <div className="relative border-b border-border/80 bg-linear-to-br from-primary/[0.07] via-card to-secondary/30 px-5 py-6 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12), transparent 45%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
              <Ticket className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                {variant === "success" ? "Submitted successfully" : "Support ticket"}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {ticket.subject}
              </h2>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 border px-2.5 py-0.5 text-xs font-semibold capitalize", grievanceStatusBadgeClass(ticket.status))}
          >
            {ticket.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Ticket ID</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <code className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-mono text-foreground break-all">
                {ticket.id}
              </code>
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" onClick={() => void copyId()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Category</dt>
            <dd className="text-sm font-medium text-foreground capitalize">{categoryLabel}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Created</dt>
            <dd className="text-sm text-foreground">{formatDate(ticket.created_at)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Last updated</dt>
            <dd className="text-sm text-foreground">{formatDate(ticket.updated_at)}</dd>
          </div>
          {ticket.reference_id ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Reference</dt>
              <dd className="font-mono text-sm text-foreground">{ticket.reference_id}</dd>
            </div>
          ) : null}
          {ticket.user_id ? (
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Linked account</dt>
              <dd className="font-mono text-xs text-slate-700 break-all dark:text-slate-300">{ticket.user_id}</dd>
            </div>
          ) : null}
        </dl>

        {ticket.description ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">Your message</p>
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap dark:bg-muted/30">
              {ticket.description}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 dark:bg-muted/25">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Resolution</p>
          {ticket.resolution_notes ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{ticket.resolution_notes}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              No update yet — our team will review your ticket and post notes here when there is progress.
            </p>
          )}
          {ticket.resolved_at ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Resolved {formatDate(ticket.resolved_at)}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
