"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { ApiError } from "@/lib/client/api-client";
import {
  createGrievance,
  fetchMySupportTickets,
  rememberSupportTicketId,
  type GrievanceCategory,
  type GrievanceRecord,
} from "@/lib/client/support-api";
import { GrievanceTicketDisplay } from "@/components/support/grievance-ticket-display";
import { SupportMyTickets } from "@/components/support/support-my-tickets";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { useAuthStore } from "@/stores/auth-store";
import { CustomerPageShell } from "@/components/shared/customer-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "data_privacy", label: "Data & privacy" },
  { value: "payment", label: "Payment" },
  { value: "booking", label: "Booking" },
  { value: "general", label: "General" },
];

export function SupportGrievanceView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasTokens = hasAuthTokens();
  const canSubmit = isAuthenticated && hasTokens;

  const { data: myTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: fetchMySupportTickets,
    enabled: canSubmit,
    staleTime: 60_000,
  });

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<GrievanceCategory>("account");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<GrievanceRecord | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please log in to submit a grievance.");
      return;
    }
    const s = subject.trim();
    const d = description.trim();
    if (s.length < 3) {
      toast.error("Please enter a short subject (at least 3 characters).");
      return;
    }
    if (d.length < 10) {
      toast.error("Please describe the issue in at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const row = await createGrievance({ subject: s, description: d, category });
      rememberSupportTicketId(row.id);
      setCreated(row);
      void queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
      toast.success("Grievance submitted.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not submit. Try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <CustomerPageShell
        eyebrow="Support"
        title="Ticket received"
        lead="Your grievance is logged. Keep your ticket ID — you can return to this page anytime while signed in."
        maxWidthClass="max-w-3xl"
      >
        <GrievanceTicketDisplay ticket={created} variant="success" />

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" asChild>
            <Link href={`/support/${created.id}`}>Open full ticket page</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCreated(null);
              setSubject("");
              setDescription("");
              setCategory("account");
            }}
          >
            Submit another grievance
          </Button>
        </div>
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell
      eyebrow="Support"
      title="Raise a grievance"
      lead="Signed-in users can submit issues to our support team. You’ll get a ticket ID — track status below or open any ticket for full details."
      maxWidthClass="max-w-3xl"
    >
      {!canSubmit ? (
        <Card className="border-border bg-muted/20">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Submitting a grievance requires an account so we can follow up securely.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/login?next=/support">Log in</Link>
              </Button>
              <Button variant="outline" type="button" onClick={() => router.push("/")}>
                Back home
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8">
          <SupportMyTickets tickets={myTickets} loading={ticketsLoading} />
        </div>
      )}

      {canSubmit ? (
        <div className="mb-4 border-b border-border pb-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Submit a new grievance</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Describe the issue — we&apos;ll reply via your account.</p>
        </div>
      ) : null}

      <form className={!canSubmit ? "pointer-events-none mt-8 opacity-50" : ""} onSubmit={onSubmit}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="g-subject">Subject</Label>
            <Input
              id="g-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the issue"
              maxLength={200}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-cat">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as GrievanceCategory)}>
              <SelectTrigger id="g-cat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-desc">Description</Label>
            <Textarea
              id="g-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Include steps, dates, or screenshots if relevant."
              rows={6}
              className="min-h-[140px] resize-y"
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Submit grievance
              </>
            )}
          </Button>
        </div>
      </form>
    </CustomerPageShell>
  );
}
