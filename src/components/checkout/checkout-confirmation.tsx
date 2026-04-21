"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ElementType } from "react";
import { format, isValid, parse } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  IndianRupee,
  Loader2,
  Mail,
  Package,
  Phone,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageFade } from "@/components/shared/page-fade";
import { cn, formatINR } from "@/lib/utils";
import { clearConsultReceiptApi, readConsultReceiptApi } from "@/lib/expert-booking-normalize";

type ConsultReceiptOk = {
  ok: true;
  provider: "stripe" | "razorpay";
  name: string;
  phone: string;
  date: string;
  time: string;
  amountInr: number;
  currency: string;
  reference: string;
  customerEmail: string | null;
  paidAt: string;
  meetLink?: string | null;
};

function formatDisplayDate(yyyyMmDd: string): string {
  if (!yyyyMmDd?.trim()) return "—";
  const d = parse(yyyyMmDd.trim(), "yyyy-MM-dd", new Date());
  return isValid(d) ? format(d, "EEEE, d MMMM yyyy") : yyyyMmDd;
}

function formatDisplayTime(t: string): string {
  if (!t?.trim()) return "—";
  const [hh, mm] = t.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh)) return t;
  const h12 = hh % 12 || 12;
  const ap = hh >= 12 ? "PM" : "AM";
  const mins = Number.isFinite(mm) ? mm : 0;
  return `${h12}:${String(mins).padStart(2, "0")} ${ap}`;
}

function formatPaidAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isValid(d) ? format(d, "d MMM yyyy, h:mm a") : iso;
}

function ReceiptRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-border/60 py-3.5 last:border-0 last:pb-0 first:pt-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 text-sm font-medium text-foreground", mono && "break-all font-mono text-[13px]")}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function CheckoutConfirmation() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id")?.trim() || "";
  const orderId = sp.get("orderId")?.trim() || "";
  const paymentRef = sessionId || orderId || "AL-PENDING";
  const apiSrc = sp.get("src")?.trim() === "api";

  const raw = sp.get("type");
  const type = raw === "token" ? "token" : raw === "consult" ? "consult" : "book";

  const [receipt, setReceipt] = useState<ConsultReceiptOk | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(type === "consult" && !apiSrc);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    if (type !== "consult") return;

    if (apiSrc) {
      const stored = readConsultReceiptApi();
      if (stored) {
        setReceipt(stored);
        setReceiptError(null);
        setReceiptLoading(false);
        clearConsultReceiptApi();
        return;
      }
      setReceiptLoading(false);
      setReceiptError("This confirmation link has expired. If payment succeeded, check your email or bookings.");
      return;
    }

    if (!sessionId && !orderId) {
      setReceiptLoading(false);
      setReceiptError("No payment reference in the URL.");
      return;
    }

    let cancelled = false;
    (async () => {
      setReceiptLoading(true);
      setReceiptError(null);
      try {
        const qs = sessionId
          ? `session_id=${encodeURIComponent(sessionId)}`
          : `payment_ref=${encodeURIComponent(orderId)}`;
        const res = await fetch(`/api/payments/consult-receipt?${qs}`);
        const data = (await res.json()) as ConsultReceiptOk | { error?: string };
        if (cancelled) return;
        if (!res.ok || !("ok" in data) || !data.ok) {
          setReceiptError((data as { error?: string }).error || "Could not load receipt.");
          setReceipt(null);
          return;
        }
        setReceipt(data);
      } catch {
        if (!cancelled) {
          setReceiptError("Could not load receipt.");
          setReceipt(null);
        }
      } finally {
        if (!cancelled) setReceiptLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, sessionId, orderId, apiSrc]);

  const copyRef = useCallback(async () => {
    const text = receipt?.reference || paymentRef;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Reference copied");
    } catch {
      toast.error("Could not copy");
    }
  }, [receipt?.reference, paymentRef]);

  return (
    <PageFade>
      <div className="relative min-h-[85vh] overflow-hidden bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_50%)]">
        <div className="mx-auto max-w-lg px-4 py-14 text-center sm:py-20">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-mid/20 text-brand-green-mid ring-4 ring-brand-green-mid/10"
        >
            <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
        </motion.div>

          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
            {type === "consult" ? "Consultation confirmed" : "You're all set"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {type === "token"
            ? "Token recorded — a concierge will confirm paperwork and delivery slots."
            : type === "consult"
                ? "Payment received. Your slot is on the calendar and an advisor will reach out before the call."
                : "Reservation recorded — the dealer will reach out with next steps."}
          </p>

          {type === "consult" ? (
            <div className="mt-10 text-left">
              {receiptLoading ? (
                <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-sm">
                  <CardContent className="flex items-center justify-center gap-3 py-14">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                    <span className="text-sm text-muted-foreground">Loading your receipt…</span>
                  </CardContent>
                </Card>
              ) : receipt ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl ring-1 ring-primary/10 backdrop-blur-sm">
                    <div className="border-b border-border/60 bg-linear-to-r from-primary/8 via-transparent to-primary/5 px-5 py-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" aria-hidden />
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/90">Booking receipt</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Expert consultation · {receipt.provider === "stripe" ? "Stripe" : "Razorpay"}
                      </p>
                    </div>
                    <CardContent className="p-5 sm:p-6">
                      <ReceiptRow icon={User} label="Name" value={receipt.name} />
                      <ReceiptRow icon={Phone} label="Mobile" value={receipt.phone} />
                      {receipt.meetLink ? (
                        <div className="flex gap-3 border-b border-border/60 py-3.5">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Video className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Video call
                            </p>
                            <a
                              href={receipt.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-block break-all text-sm font-medium text-primary underline underline-offset-2"
                            >
                              {receipt.meetLink}
                            </a>
                          </div>
                        </div>
                      ) : null}
                      <ReceiptRow icon={Calendar} label="Preferred date" value={formatDisplayDate(receipt.date)} />
                      <ReceiptRow icon={Clock} label="Time window" value={formatDisplayTime(receipt.time)} />
                      <ReceiptRow
                        icon={IndianRupee}
                        label="Amount paid"
                        value={`${formatINR(receipt.amountInr)} ${receipt.currency}`}
                      />
                      {receipt.customerEmail ? (
                        <ReceiptRow icon={Mail} label="Email (from checkout)" value={receipt.customerEmail} />
                      ) : null}
                      <ReceiptRow icon={Clock} label="Paid at" value={formatPaidAt(receipt.paidAt)} />
                      <div className="mt-4 rounded-xl border border-border/80 bg-muted/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 text-left">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Payment reference
                            </p>
                            <p className="mt-1 break-all font-mono text-xs font-medium text-foreground">{receipt.reference}</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={copyRef}>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5 text-left shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What happens next</p>
                    <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        We&apos;ll WhatsApp or call you at the number above to confirm the slot.
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        Your advisor reviews your Autolokate shortlist before the 15-minute session.
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        You&apos;ll get a short email recap after the call.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <Card className="border-amber-500/25 bg-amber-500/5">
                  <CardContent className="space-y-3 p-6 text-left">
                    <p className="text-sm font-medium text-foreground">We couldn&apos;t load every detail</p>
                    <p className="text-sm text-muted-foreground">{receiptError || "Try again in a moment, or keep this reference for support."}</p>
                    <div className="rounded-lg border border-border bg-background/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</p>
                      <p className="mt-1 break-all font-mono text-sm">{paymentRef}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copyRef}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy reference
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="mt-10 border-border/80 bg-card/90 text-left shadow-lg backdrop-blur-sm">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              Reference
            </div>
                <p className="break-all font-mono text-lg font-semibold text-foreground">{paymentRef}</p>
                <p className="text-xs text-muted-foreground">
                  {type === "token"
                    ? "Token reference — concierge will align on paperwork."
                    : "Booking reference — finalize payment with your bank if needed."}
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5" onClick={copyRef}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
          </CardContent>
        </Card>
          )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard/user">Go to dashboard</Link>
          </Button>
            {type === "consult" ? (
              <Button variant="outline" className="border-primary/25" asChild>
                <Link href="/book-expert">Book another session</Link>
              </Button>
            ) : null}
          <Button variant="outline" className="border-primary/25" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to research
              </Link>
          </Button>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
