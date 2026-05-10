"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, CalendarDays, Clock3, ReceiptText, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { getBookingById, getMyBookings } from "@/lib/client/booking-api";
import { normalizeMyBookings, type UserBookingSummary } from "@/lib/expert-booking-normalize";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

type BookingDetail = Record<string, unknown>;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function statusTone(status: string, isDark: boolean): string {
  const s = status.toLowerCase();
  if (s.includes("confirm"))
    return isDark
      ? "text-blue-300 bg-blue-500/15 border-blue-400/30"
      : "text-blue-700 bg-blue-50 border-blue-200";
  if (s.includes("cancel"))
    return isDark
      ? "text-rose-300 bg-rose-500/15 border-rose-400/30"
      : "text-rose-600 bg-rose-50 border-rose-200";
  if (s.includes("pending"))
    return isDark
      ? "text-amber-200 bg-amber-500/15 border-amber-400/30"
      : "text-amber-700 bg-amber-50 border-amber-200";
  return isDark
    ? "text-zinc-300 bg-zinc-500/15 border-zinc-400/30"
    : "text-zinc-600 bg-zinc-100 border-zinc-300";
}

function isUpcomingActive(booking: UserBookingSummary): boolean {
  const s = booking.status.toLowerCase();
  if (s.includes("cancel") || s.includes("complete") || s.includes("failed") || s.includes("expired")) return false;
  return true;
}

function extractPayment(detail: BookingDetail | null): Record<string, unknown> | null {
  if (!detail) return null;
  const data = asRecord(detail.data) ?? detail;
  return asRecord(data.payment) ?? asRecord(data.transaction) ?? null;
}

function extractBooking(detail: BookingDetail | null): Record<string, unknown> | null {
  if (!detail) return null;
  const data = asRecord(detail.data) ?? detail;
  return asRecord(data.booking) ?? asRecord(data) ?? null;
}

function kvRows(source: Record<string, unknown> | null): Array<{ key: string; value: string }> {
  if (!source) return [];
  return Object.entries(source)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({ key, value: typeof value === "object" ? JSON.stringify(value) : String(value) }));
}

function readField(source: Record<string, unknown> | null, key: string): string {
  if (!source) return "";
  const value = source[key];
  if (value === null || value === undefined) return "";
  return String(value);
}

function maskSignature(signature: string): string {
  const value = signature.trim();
  if (!value) return "—";
  if (value.length <= 12) return "********";
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
}

export function BookingsHistoryPageClient() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserBookingSummary[]>([]);
  const [activeDetail, setActiveDetail] = useState<BookingDetail | null>(null);
  const [activeDetailLoading, setActiveDetailLoading] = useState(false);
  // Defer auth check to client to avoid SSR/client hydration mismatch.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(hasAuthTokens());
  }, []);

  const load = useCallback(async () => {
    if (!hasAuthTokens()) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await getMyBookings();
      const normalized = normalizeMyBookings(raw);
      setItems(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeBooking = useMemo(() => items.find(isUpcomingActive) ?? null, [items]);

  useEffect(() => {
    const run = async () => {
      if (!activeBooking) {
        setActiveDetail(null);
        return;
      }
      setActiveDetailLoading(true);
      try {
        const detail = await getBookingById(activeBooking.id);
        setActiveDetail((asRecord(detail) ?? { detail }) as BookingDetail);
      } catch {
        setActiveDetail(null);
      } finally {
        setActiveDetailLoading(false);
      }
    };
    void run();
  }, [activeBooking]);

  const payment = extractPayment(activeDetail);
  const booking = extractBooking(activeDetail);
  const razorpayOrderId = readField(payment, "razorpay_order_id");
  const razorpayPaymentId = readField(payment, "razorpay_payment_id");
  const razorpaySignature = readField(payment, "razorpay_signature");
  const paymentStatus = readField(payment, "status");
  const refundDeadline = readField(payment, "refund_deadline_at");

  const copyReferenceIds = useCallback(async () => {
    const rows = [
      `booking_id: ${activeBooking?.id ?? "—"}`,
      `razorpay_order_id: ${razorpayOrderId || "—"}`,
      `razorpay_payment_id: ${razorpayPaymentId || "—"}`,
      `payment_status: ${paymentStatus || "—"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(rows);
    } catch {
      // no-op fallback
    }
  }, [activeBooking?.id, razorpayOrderId, razorpayPaymentId, paymentStatus]);

  /* ─── Theme tokens ─── */
  const pageBg = isDark ? "min-h-screen bg-[#050506] text-zinc-100" : "min-h-screen bg-background text-foreground";
  const card = isDark ? "rounded-2xl border border-white/10 bg-zinc-900/60 p-5" : "rounded-2xl border border-border bg-card p-5 shadow-sm";
  const innerCard = isDark ? "rounded-xl border border-white/10 bg-zinc-950/60 p-4" : "rounded-xl border border-border bg-muted/30 p-4";
  const mutedText = isDark ? "text-zinc-400" : "text-muted-foreground";
  const headingText = isDark ? "text-white" : "text-foreground";

  return (
    <main className={cn(pageBg, "px-4 py-6 sm:px-6 sm:py-8")}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Expert call</p>
            <h1 className={cn("mt-1 text-2xl font-bold tracking-tight", headingText)}>Your bookings</h1>
          </div>
          <Button
            asChild
            variant="outline"
            className={cn(
              "gap-1.5",
              isDark
                ? "border-white/20 bg-transparent text-zinc-100 hover:bg-white/5"
                : "border-border bg-transparent text-foreground hover:bg-muted"
            )}
          >
            <Link href="/book-expert">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to booking
            </Link>
          </Button>
        </div>

        {/* Not signed in */}
        {!authed ? (
          <div
            className={cn(
              "rounded-2xl border p-5",
              isDark ? "border-amber-400/30 bg-amber-500/10" : "border-amber-200 bg-amber-50"
            )}
          >
            <p className={cn("font-semibold", isDark ? "text-amber-100" : "text-amber-900")}>
              Sign in to see your booking details.
            </p>
            <Button asChild className="mt-3">
              <Link href="/login?next=/book-expert/bookings">Sign in</Link>
            </Button>
          </div>
        ) : null}

        {/* Active booking */}
        <section className={card}>
          <h2 className={cn("text-lg font-semibold", headingText)}>Active booking</h2>
          {loading || activeDetailLoading ? (
            <div className={cn("mt-4 flex items-center gap-2", mutedText)}>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading active booking...
            </div>
          ) : !activeBooking ? (
            <p className={cn("mt-4 text-sm", mutedText)}>No active booking found.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Slot info */}
              <div className={innerCard}>
                <p
                  className={cn(
                    "inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase",
                    statusTone(activeBooking.status, isDark)
                  )}
                >
                  {activeBooking.status}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className={cn("flex items-center gap-2", mutedText)}>
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {activeBooking.slotDate || "—"}
                </p>
                  <p className={cn("flex items-center gap-2", mutedText)}>
                    <Clock3 className="h-4 w-4 text-primary" />
                    {activeBooking.slotStartLabel}
                  </p>
                  {activeBooking.meetLink ? (
                    <a
                      className="mt-2 inline-flex items-center gap-2 text-primary underline hover:text-primary/80 transition-colors"
                      href={activeBooking.meetLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Video className="h-4 w-4" />
                      Join meet
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Payment details */}
              <div className={innerCard}>
                <p className={cn("flex items-center gap-2 text-sm font-semibold", headingText)}>
                  <ReceiptText className="h-4 w-4 text-primary" />
                  Payment details
                </p>
                {payment ? (
                  <div className={cn("mt-2 space-y-1 text-xs", mutedText)}>
                    {kvRows(payment)
                      .slice(0, 10)
                      .map((row) => (
                        <p key={row.key}>
                          <span className={isDark ? "text-zinc-500" : "text-muted-foreground/60"}>{row.key}:</span>{" "}
                          {row.value}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className={cn("mt-2 text-xs", mutedText)}>No payment object returned for this booking.</p>
                )}
              </div>

              {/* Booking object */}
              <div className={cn(innerCard, "md:col-span-2")}>
                <p className={cn("text-sm font-semibold", headingText)}>Booking object</p>
                <div className={cn("mt-2 grid gap-1 text-xs sm:grid-cols-2", mutedText)}>
                  {kvRows(booking).map((row) => (
                    <p key={row.key}>
                      <span className={isDark ? "text-zinc-500" : "text-muted-foreground/60"}>{row.key}:</span>{" "}
                      {row.value}
                    </p>
                  ))}
                </div>
              </div>

              {/* Payment verification */}
              <div
                className={cn(
                  "md:col-span-2 rounded-xl border p-4",
                  isDark
                    ? "border-primary/25 bg-primary/8"
                    : "border-primary/20 bg-primary/5"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn("text-sm font-semibold", isDark ? "text-blue-100" : "text-primary")}>
                    Payment verification
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 px-3 text-xs",
                      isDark
                        ? "border-primary/30 bg-transparent text-blue-100 hover:bg-primary/10"
                        : "border-primary/30 bg-transparent text-primary hover:bg-primary/5"
                    )}
                    onClick={() => void copyReferenceIds()}
                  >
                    Copy reference IDs
                  </Button>
                </div>
                <div className={cn("mt-3 grid gap-2 text-xs sm:grid-cols-2", isDark ? "text-zinc-200" : "text-primary/90")}>
                  <p>
                    <span className={mutedText}>razorpay_order_id:</span> {razorpayOrderId || "—"}
                  </p>
                  <p>
                    <span className={mutedText}>razorpay_payment_id:</span> {razorpayPaymentId || "—"}
                  </p>
                  <p>
                    <span className={mutedText}>razorpay_signature:</span> {maskSignature(razorpaySignature)}
                  </p>
                  <p>
                    <span className={mutedText}>status:</span> {paymentStatus || "—"}
                  </p>
                  <p className="sm:col-span-2">
                    <span className={mutedText}>refund_deadline_at:</span> {refundDeadline || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Booking history */}
        <section className={card}>
          <h2 className={cn("text-lg font-semibold", headingText)}>Booking history</h2>
          {loading ? (
            <div className={cn("mt-4 flex items-center gap-2", mutedText)}>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading history...
            </div>
          ) : items.length === 0 ? (
            <p className={cn("mt-4 text-sm", mutedText)}>No bookings yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((b) => (
                <li
                  key={b.id}
                  className={cn(
                    "rounded-xl border p-4",
                    isDark
                      ? "border-white/10 bg-zinc-950/60"
                      : "border-border bg-muted/30"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={cn(
                        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase",
                        statusTone(b.status, isDark)
                      )}
                    >
                      {b.status}
                    </p>
                    <p className={cn("font-mono text-xs", mutedText)}>{b.id}</p>
                  </div>
                  <p className={cn("mt-2 text-sm", isDark ? "text-zinc-200" : "text-foreground/80")}>{b.slotDate}</p>
                  <p className={cn("text-sm", mutedText)}>{b.slotStartLabel}</p>
                </li>
              ))}
            </ul>
          )}
          <div className={cn("mt-4 flex items-start gap-2 text-xs", mutedText)}>
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Active booking card shows payment/booking details when returned by booking detail API.
          </div>
        </section>
      </div>
    </main>
  );
}
