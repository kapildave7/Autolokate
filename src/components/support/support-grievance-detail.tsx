"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/client/api-client";
import { getGrievance, rememberSupportTicketId, type GrievanceRecord } from "@/lib/client/support-api";
import { GrievanceTicketDisplay } from "@/components/support/grievance-ticket-display";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { useAuthStore } from "@/stores/auth-store";
import { CustomerPageShell } from "@/components/shared/customer-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = { id: string };

export function SupportGrievanceDetail({ id }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasTokens = hasAuthTokens();
  const canLoad = isAuthenticated && hasTokens;

  const [row, setRow] = useState<GrievanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!canLoad) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getGrievance(id);
        rememberSupportTicketId(data.id);
        if (!cancelled) setRow(data);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          if (!cancelled) setNotFound(true);
        } else {
          toast.error(e instanceof ApiError ? e.message : "Could not load ticket.");
          if (!cancelled) setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canLoad]);

  if (!canLoad) {
    return (
      <CustomerPageShell eyebrow="Support" title="Ticket" lead="" maxWidthClass="max-w-2xl">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-slate-700 dark:text-slate-300">Log in to view this grievance.</p>
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(`/support/${id}`)}`}>Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </CustomerPageShell>
    );
  }

  if (loading) {
    return (
      <CustomerPageShell eyebrow="Support" title="Ticket" lead="" maxWidthClass="max-w-2xl">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading ticket…</span>
        </div>
      </CustomerPageShell>
    );
  }

  if (notFound || !row) {
    return (
      <CustomerPageShell eyebrow="Support" title="Ticket not found" lead="We couldn’t load this grievance." maxWidthClass="max-w-2xl">
        <Button variant="outline" asChild>
          <Link href="/support">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to support
          </Link>
        </Button>
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell
      eyebrow="Support"
      title="Your ticket"
      lead="Details below match what we store for this grievance."
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/support">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New grievance
          </Link>
        </Button>

        <GrievanceTicketDisplay ticket={row} variant="detail" />
      </div>
    </CustomerPageShell>
  );
}
