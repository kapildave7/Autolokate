"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, CalendarDays, Clock3, ReceiptText, Video, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { getBookingById, getMyBookings } from "@/lib/client/booking-api";
import { normalizeMyBookings, type UserBookingSummary } from "@/lib/expert-booking-normalize";

type BookingDetail = Record<string, unknown>;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("confirm")) return "text-emerald-300 bg-emerald-500/15 border-emerald-400/30";
  if (s.includes("cancel")) return "text-rose-300 bg-rose-500/15 border-rose-400/30";
  if (s.includes("pending")) return "text-amber-200 bg-amber-500/15 border-amber-400/30";
  return "text-zinc-300 bg-zinc-500/15 border-zinc-400/30";
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
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserBookingSummary[]>([]);
  const [activeDetail, setActiveDetail] = useState<BookingDetail | null>(null);
  const [activeDetailLoading, setActiveDetailLoading] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Book expert</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Your bookings</h1>
          </div>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100 hover:bg-white/5">
            <Link href="/book-expert">Back to booking</Link>
          </Button>
        </div>

        {!hasAuthTokens() ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
            <p className="font-semibold text-amber-100">Sign in to see your booking details.</p>
            <Button asChild className="mt-3">
              <Link href="/login?next=/book-expert/bookings">Sign in</Link>
            </Button>
          </div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <h2 className="text-lg font-semibold">Active booking</h2>
          {loading || activeDetailLoading ? (
            <div className="mt-4 flex items-center gap-2 text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading active booking...
            </div>
          ) : !activeBooking ? (
            <p className="mt-4 text-zinc-400">No active booking found.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                <p className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase ${statusTone(activeBooking.status)}`}>
                  {activeBooking.status}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-300" />{activeBooking.slotDate || "—"}</p>
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-300" />{activeBooking.slotStartLabel}</p>
                  {activeBooking.meetLink ? (
                    <a className="mt-2 inline-flex items-center gap-2 text-emerald-300 underline" href={activeBooking.meetLink} target="_blank" rel="noreferrer">
                      <Video className="h-4 w-4" /> Join meet
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                <p className="text-sm font-semibold flex items-center gap-2"><ReceiptText className="h-4 w-4 text-emerald-300" /> Payment details</p>
                {payment ? (
                  <div className="mt-2 space-y-1 text-xs text-zinc-300">
                    {kvRows(payment).slice(0, 10).map((row) => (
                      <p key={row.key}><span className="text-zinc-500">{row.key}:</span> {row.value}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">No payment object returned for this booking.</p>
                )}
              </div>
              <div className="md:col-span-2 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                <p className="text-sm font-semibold">Booking object</p>
                <div className="mt-2 grid gap-1 text-xs text-zinc-300 sm:grid-cols-2">
                  {kvRows(booking).map((row) => (
                    <p key={row.key}><span className="text-zinc-500">{row.key}:</span> {row.value}</p>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 rounded-xl border border-emerald-400/25 bg-emerald-500/8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-emerald-100">Payment verification</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 border-emerald-300/30 bg-transparent px-3 text-xs text-emerald-100 hover:bg-emerald-500/10"
                    onClick={() => void copyReferenceIds()}
                  >
                    Copy reference IDs
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-zinc-200 sm:grid-cols-2">
                  <p><span className="text-zinc-400">razorpay_order_id:</span> {razorpayOrderId || "—"}</p>
                  <p><span className="text-zinc-400">razorpay_payment_id:</span> {razorpayPaymentId || "—"}</p>
                  <p><span className="text-zinc-400">razorpay_signature:</span> {maskSignature(razorpaySignature)}</p>
                  <p><span className="text-zinc-400">status:</span> {paymentStatus || "—"}</p>
                  <p className="sm:col-span-2"><span className="text-zinc-400">refund_deadline_at:</span> {refundDeadline || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
          <h2 className="text-lg font-semibold">Booking history</h2>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : items.length === 0 ? (
            <p className="mt-4 text-zinc-400">No bookings yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((b) => (
                <li key={b.id} className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase ${statusTone(b.status)}`}>{b.status}</p>
                    <p className="text-xs text-zinc-500">{b.id}</p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{b.slotDate}</p>
                  <p className="text-sm text-zinc-400">{b.slotStartLabel}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Active booking card shows payment/booking details when returned by booking detail API.
          </div>
        </section>
      </div>
    </main>
  );
}
