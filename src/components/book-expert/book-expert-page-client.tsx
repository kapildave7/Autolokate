"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useExpertBookingPayment } from "@/hooks/use-expert-booking-payment";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { BookExpertCalendar } from "@/components/book-expert/book-expert-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Car,
  Check,
  Clock,
  ExternalLink,
  Gauge,
  Headphones,
  IndianRupee,
  KeyRound,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Video,
  Youtube,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IDG_FOUNDER, INDIAN_DRIVE_GUIDE_CHANNEL_URL } from "@/lib/indian-drive-guide-youtube";
import { cancelBooking, getBookingSlotsByDate, getMyBookings } from "@/lib/client/booking-api";
import { ApiError } from "@/lib/client/api-client";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { useAuthStore } from "@/stores/auth-store";
import {
  normalizeMyBookings,
  normalizeSlotsForDate,
  type ExpertTimeSlot,
  type UserBookingSummary,
} from "@/lib/expert-booking-normalize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "@/providers/theme-provider";

const SESSION_FEE = 400;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

const OUTCOME_LINES = [
  "Cut through 2–4 finalists: city, fuel, on-road budget — not generic lists.",
  "Variant truth for your kms, family, and resale — skip brochure overload.",
  "Ownership reality: service costs, known issues, and how to negotiate.",
  "You leave with a primary pick, a backup, and the next physical step.",
] as const;

const VALUE_PILLARS = [
  {
    icon: Car,
    title: "Built for Indian buyers",
    body: "Traffic, fuel prices, service networks, and resale — not generic global reviews.",
  },
  {
    icon: ShieldCheck,
    title: "No dealer playbook",
    body: "We don't earn from showrooms. The session is aligned to your shortlist and budget only.",
  },
  {
    icon: IndianRupee,
    title: "One transparent fee",
    body: "Pay once via Razorpay. Amount is confirmed at checkout; GST included.",
  },
  {
    icon: Sparkles,
    title: "Clarity that pays for itself",
    body: "One short call can save weeks of forum rabbit holes and costly variant or timing mistakes.",
  },
] as const;

const FLOW_STEPS = [
  { step: "1", title: "Sign in", text: "OTP login links bookings and payments to your account." },
  { step: "2", title: "Pick a slot", text: "Choose date & time from live availability." },
  { step: "3", title: "Pay on Razorpay", text: "UPI, cards, or wallets — order created for your booking." },
  { step: "4", title: "Get confirmed", text: "We verify payment; you'll see status here and in email." },
  { step: "5", title: "Join the call", text: "Meet link appears when your session is ready — same page, anytime." },
] as const;

const FAQ_ITEMS = [
  {
    q: "Can I book more than one session?",
    a: "Yes. Each slot is a separate booking and payment. Manage them all under Your bookings.",
  },
  {
    q: "Payment didn't finish — what now?",
    a: "Open Your bookings and tap Complete payment on the pending row. Same slot is held until checkout completes or you cancel.",
  },
  {
    q: "How do I cancel?",
    a: "Use Cancel on a booking card when eligible. Refunds follow the policy shown at checkout.",
  },
  {
    q: "Is this financial or legal advice?",
    a: "No — it's practical car-buying guidance. For loans, insurance, or contracts, consult licensed professionals.",
  },
] as const;

const FLOAT = [
  { Icon: Car, className: "left-[4%] top-[28%] max-lg:hidden", size: 56 },
  { Icon: KeyRound, className: "right-[8%] top-[20%] max-md:hidden", size: 48 },
  { Icon: Gauge, className: "left-[12%] bottom-[32%] max-lg:hidden", size: 44 },
  { Icon: CalendarDays, className: "right-[14%] bottom-[38%] max-md:hidden", size: 52 },
  { Icon: IndianRupee, className: "left-[22%] top-[12%] max-xl:hidden", size: 40 },
  { Icon: Zap, className: "right-[22%] top-[36%] max-xl:hidden", size: 36 },
] as const;

function FloatingIcons({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {FLOAT.map(({ Icon, className, size }, i) => (
        <motion.div
          key={i}
          className={cn("absolute text-primary/[0.07]", className)}
          initial={reduceMotion ? false : { y: 0, opacity: 0.5 }}
          animate={reduceMotion ? undefined : { y: [0, -10, 0], opacity: [0.45, 0.65, 0.45] }}
          transition={{
            duration: 7 + i * 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        >
          <Icon strokeWidth={1.15} style={{ width: size, height: size }} />
        </motion.div>
      ))}
    </div>
  );
}

function statusBadge(status: string, isDark: boolean): string {
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

function statusDot(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("confirm")) return "bg-blue-500";
  if (s.includes("cancel")) return "bg-rose-500";
  if (s.includes("pending")) return "bg-amber-400";
  return "bg-zinc-400";
}

function BookingHistoryMini({
  bookings,
  isDark,
}: {
  bookings: UserBookingSummary[];
  isDark: boolean;
}) {
  const rows = bookings.slice(0, 5);

  return (
    <div className={cn("rounded-2xl border", isDark ? "border-white/10 bg-zinc-900/60" : "border-border bg-card shadow-sm")}>
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "border-white/8" : "border-border")}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Booking History
        </p>
        <Link
          href="/book-expert/bookings"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-5 text-xs text-muted-foreground">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-xs">
            <thead>
              <tr className={cn("border-b", isDark ? "border-white/5" : "border-border/50")}>
                {["Transaction ID", "Date", "Status", "Time"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isDark ? "border-white/5 hover:bg-white/3" : "border-border/30 hover:bg-muted/30"
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-foreground/80">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", statusDot(b.status))} aria-hidden />
                      {b.id.length > 12 ? `${b.id.slice(0, 12)}…` : b.id}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{b.slotDate || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusBadge(b.status, isDark))}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{b.slotStartLabel || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookings.some((b) => b.meetLink) && (
        <div className={cn("border-t px-4 py-3", isDark ? "border-white/5" : "border-border/50")}>
          {bookings.filter((b) => b.meetLink).slice(0, 1).map((b) => (
            <a
              key={b.id}
              href={b.meetLink!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Video className="h-3.5 w-3.5" aria-hidden />
              Join active session
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <header className="space-y-1.5 sm:space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
        {eyebrow}
      </p>
      <h2 id={id} className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
    </header>
  );
}

export function BookExpertPageClient() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { pay, paying } = useExpertBookingPayment();
  const user = useAuthStore((s) => s.user);
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<ExpertTimeSlot | null>(null);
  const [slots, setSlots] = useState<ExpertTimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<UserBookingSummary[]>([]);
  const [cancelTarget, setCancelTarget] = useState<UserBookingSummary | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // Start as false on both server and client to avoid hydration mismatch.
  // hasAuthTokens() reads localStorage which only exists on the client.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(hasAuthTokens());
  }, []);

  const effectivePhone = phone.trim() || (user?.phone ? String(user.phone) : "");
  const effectiveName = name.trim() || (user?.full_name ? String(user.full_name) : "");
  const contactReadyForPayment = Boolean(
    authed && effectiveName.length > 0 && digitsOnly(effectivePhone).length >= 10
  );
  const phoneDigits = phone.replace(/\D/g, "").length;
  const ready = Boolean(contactReadyForPayment && date && selectedSlot);

  const loadBookings = useCallback(async () => {
    if (!hasAuthTokens()) { setBookings([]); return; }
    try {
      const raw = await getMyBookings();
      setBookings(normalizeMyBookings(raw));
    } catch { setBookings([]); }
  }, []);

  useEffect(() => {
    if (!hasAuthTokens()) return;
    void hydrateProfile().catch(() => {});
  }, [hydrateProfile]);

  useEffect(() => {
    if (!user) return;
    setName((prev) => prev.trim() || (user.full_name ? String(user.full_name) : ""));
    setPhone((prev) => prev.trim() || (user.phone ? String(user.phone) : ""));
  }, [user]);

  useEffect(() => { void loadBookings(); }, [loadBookings]);

  useEffect(() => {
    if (!date || !authed) {
      setSlots([]); setSelectedSlot(null); setSlotsError(null); return;
    }
    let cancelled = false;
    setSlotsLoading(true); setSlotsError(null); setSelectedSlot(null);
    (async () => {
      try {
        const raw = await getBookingSlotsByDate(date);
        if (cancelled) return;
        const next = normalizeSlotsForDate(raw, date);
        setSlots(next);
        if (next.length === 0) setSlotsError("No open slots on this day — try another date.");
      } catch (err) {
        if (!cancelled) {
          setSlotsError(err instanceof ApiError ? err.message : "Could not load slots.");
          setSlots([]);
        }
      } finally { if (!cancelled) setSlotsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [date, authed]);

  const handlePay = async () => {
    if (!ready || !selectedSlot) return;
    trackEvent("book_call_click", { event_category: GA_CATEGORIES.conversion, price: SESSION_FEE, source: "book_expert_page", provider: "razorpay" });
    await pay({ name: effectiveName, phone: effectivePhone, slotDate: date, slot: selectedSlot });
    void loadBookings();
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    setCancellingId(id);
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled.");
      trackEvent("book_expert_cancel", { event_category: GA_CATEGORIES.conversion, booking_id: id });
      setCancelTarget(null);
      await loadBookings();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not cancel booking.");
    } finally { setCancellingId(null); }
  };

  /* ── Surface helpers (theme-aware) ── */
  const card = cn(
    "rounded-2xl border",
    isDark ? "border-white/10 bg-zinc-900/55 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.45)]" : "border-border bg-card shadow-sm"
  );
  const cardDeep = cn(
    "rounded-3xl border",
    isDark ? "border-white/12 bg-zinc-900/45 backdrop-blur-md shadow-[0_24px_60px_-40px_rgba(0,0,0,0.55)]" : "border-border bg-card shadow-sm"
  );
  const inputCls = isDark
    ? "border-zinc-600/80 bg-zinc-950/95 text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:border-primary/50 focus-visible:ring-primary/25"
    : "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-primary/20";

  return (
    <div className="antialiased" data-book-expert-page>
      {/* Ambient background — inherits site bg, adds a soft blue halo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className={cn(
          "absolute inset-0",
          isDark
            ? "bg-[radial-gradient(ellipse_130%_90%_at_50%_-25%,rgba(37,99,235,0.14),transparent_58%)]"
            : "bg-[radial-gradient(ellipse_130%_90%_at_50%_-25%,rgba(37,99,235,0.06),transparent_58%)]"
        )} />
        {isDark && (
          <>
            <div className="absolute -left-[18%] top-0 h-[62vh] w-[75vw] rounded-full bg-blue-500/8 blur-[140px]" />
            <div className="absolute -right-[10%] top-[14%] h-[45vh] w-[55vw] rounded-full bg-indigo-400/6 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }}
            />
          </>
        )}
      </div>
      <FloatingIcons reduceMotion={reduceMotion} />

      <main className="relative">
        {/* ── Hero ── */}
        <section
          className={cn(
            "relative overflow-hidden border-b border-border px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10",
            isDark
              ? "bg-[radial-gradient(ellipse_140%_80%_at_55%_0%,rgba(37,99,235,0.13),transparent_55%)]"
              : "bg-[radial-gradient(ellipse_160%_110%_at_60%_-10%,rgba(219,234,254,0.85),rgba(239,246,255,0.5)_55%,transparent_75%)]"
          )}
          aria-labelledby="book-expert-heading"
        >
          {/* Faint car silhouette watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <Car className={cn(
              "h-[260px] w-[260px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]",
              isDark ? "text-blue-400/[0.04]" : "text-blue-400/[0.09]"
            )} />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
              {/* Left: copy */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary sm:tracking-[0.2em]">
                  Expert call <span className="opacity-50">·</span>
                </p>
                <h1
                  id="book-expert-heading"
                  className="font-display mt-2.5 max-w-3xl text-3xl font-bold leading-[1.08] tracking-tight text-foreground sm:mt-3 sm:text-4xl sm:leading-[1.05] lg:text-[2.75rem]"
                >
                  A clear car decision
                  <span className="mt-1 block text-primary sm:mt-0">
                    in 15 minutes.
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
                  One session with an Autolokate advisor — same practical lens as Indian Drive Guide / Deepak Chaudhary. Flat fee, no dealer kickbacks.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:px-3.5">
                    <Headphones className="h-3.5 w-3.5" aria-hidden />
                    15 min live
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm dark:bg-white/5 sm:px-3.5">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    1:1 Expert call
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm dark:bg-white/5 sm:px-3.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                    GST included
                  </span>
                </div>
                <div className="mt-6 sm:mt-7">
                  <Button variant="default" className="h-11 rounded-xl px-6 text-sm font-semibold" asChild>
                    <a href="#book-session">
                      <Clock className="mr-2 h-4 w-4" aria-hidden />
                      Book a session — pick a slot
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right: unified stat card */}
              <div className={cn(
                "rounded-2xl border px-5 py-5 shadow-lg",
                isDark
                  ? "border-white/12 bg-zinc-900/75 shadow-black/30 backdrop-blur-md"
                  : "border-blue-100/80 bg-white/95 shadow-blue-100/60"
              )}>
                {/* 15 min row */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Clock className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-foreground">15 min</p>
                    <p className="text-xs text-muted-foreground">Structured 1:1 call</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-border/60" />

                {/* Pricing */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">From</p>
                  <p className="font-display mt-0.5 text-[2rem] font-bold leading-none tabular-nums text-foreground">
                    ₹{SESSION_FEE}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">GST included</p>
                </div>

                {/* Checklist */}
                <ul className="mt-4 space-y-2">
                  {["Server-priced at checkout", "No hidden charges", "Cancel or reschedule anytime"].map((c) => (
                    <li key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why book ── */}
        <section className="border-b border-border px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="why-book">
          <div className="mx-auto max-w-6xl">
            <p id="why-book" className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Why book a session?
            </p>
            <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {VALUE_PILLARS.map((p) => (
                <div key={p.title} className={cn(card, "p-5")}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
                    <p.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <p className="mt-3 font-display text-base font-semibold text-foreground sm:text-[1.0625rem]">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder ── */}
        <section className="relative border-b border-border px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="founder-heading">
          {isDark && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(37,99,235,0.07),transparent_55%)]" aria-hidden />
          )}
          <div className="relative mx-auto max-w-6xl">
            <div className={cn(cardDeep, "p-5 sm:p-7 lg:p-9")}>
              <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,300px)_1fr]">
                <div className="mx-auto flex w-full max-w-[280px] flex-col items-center lg:mx-0 lg:max-w-none">
                  <div className="relative w-full max-w-[240px] sm:max-w-[260px] lg:max-w-none">
                    {isDark && (
                      <div className="pointer-events-none absolute -inset-3 rounded-full bg-linear-to-br from-blue-400/20 via-indigo-500/12 to-transparent blur-2xl" aria-hidden />
                    )}
                    <div className={cn(
                      "relative aspect-square overflow-hidden rounded-full border bg-muted",
                      isDark
                        ? "border-white/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] ring-2 ring-primary/20"
                        : "border-border shadow-sm ring-2 ring-primary/15"
                    )}>
                      <Image
                        src={IDG_FOUNDER.avatarUrl}
                        alt={`${IDG_FOUNDER.name}, ${IDG_FOUNDER.title}`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 260px, 300px"
                        priority
                      />
                    </div>
                    <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:mt-4 sm:tracking-[0.2em] lg:text-left">
                      Session lead
                    </p>
                  </div>
                </div>

                <div className="min-w-0 space-y-4 sm:space-y-5">
                  <span className="inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                    Indian Drive Guide
                  </span>
                  <header className="space-y-1.5 pt-0.5 sm:space-y-2">
                    <h2 id="founder-heading" className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Deepak Chaudhary
                    </h2>
                    <p className="text-sm font-medium text-primary sm:text-base">
                      Founder — Practical guidance for Indian buyers
                    </p>
                  </header>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                    Sessions follow the same approach as the channel: shortlist, budget, ownership reality — straight talk, no scripts.
                  </p>
                  <Button
                    variant="cta"
                    className="h-10 w-full gap-2 rounded-xl border-0 bg-linear-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/40 hover:brightness-110 sm:w-auto sm:px-5"
                    asChild
                  >
                    <Link
                      href={INDIAN_DRIVE_GUIDE_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent("book_expert_idg_channel_click", { event_category: GA_CATEGORIES.media, source: "founder_section" })}
                    >
                      <Youtube className="h-4 w-4 shrink-0" aria-hidden />
                      Watch on YouTube
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content + Booking sidebar ── */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">

            {/* ── Booking form sidebar ── */}
            <aside
              className="order-1 min-w-0 lg:order-2 lg:col-span-5 lg:flex lg:min-h-0 lg:flex-col lg:self-start lg:sticky lg:top-16"
              aria-labelledby="book-session-title"
            >
              <h2 id="book-session-title" className="sr-only">Reserve and pay for your session</h2>
              <div className="flex flex-col gap-4">

                {/* Booking form card */}
                <motion.div
                  initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  id="book-session"
                  className={cn(
                    "flex w-full flex-col overflow-hidden rounded-2xl border",
                    isDark
                      ? "border-white/12 bg-zinc-900/88 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.75)] backdrop-blur-xl ring-1 ring-primary/10"
                      : "border-border bg-card shadow-sm"
                  )}
                >
                  {/* Form header */}
                  <div className={cn(
                    "relative shrink-0 border-b px-4 py-3.5 sm:px-5",
                    isDark ? "border-white/8 bg-zinc-900/98" : "border-border bg-muted/30"
                  )}>
                    {isDark && (
                      <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" aria-hidden />
                    )}
                    <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">Reserve a slot</p>
                        <ul className="mt-2 space-y-1.5">
                          {["15 min expert call", "Email recap after the call"].map((item) => (
                            <li key={item} className="flex items-center gap-2 text-xs leading-snug text-muted-foreground">
                              <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2.5 text-right sm:px-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary sm:text-xs">From</p>
                        <p className="font-display text-2xl font-bold tabular-nums leading-none text-foreground sm:text-[1.75rem]">
                          ₹{SESSION_FEE}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Final total at Razorpay · GST incl.</p>
                      </div>
                    </div>
                  </div>

                  {/* Form body */}
                  <div className="space-y-4 px-4 py-4 sm:px-5">
                    {/* Sign-in prompt */}
                    {!authed && (
                      <div className={cn(
                        "rounded-xl border px-3.5 py-3 text-xs leading-snug sm:text-[0.8125rem]",
                        isDark ? "border-amber-500/25 bg-amber-500/10 text-amber-100/95" : "border-amber-200 bg-amber-50 text-amber-800"
                      )}>
                        <p className={cn("font-semibold", isDark ? "text-amber-50" : "text-amber-900")}>Sign in required</p>
                        <p className={cn("mt-1.5", isDark ? "text-amber-100/85" : "text-amber-700")}>
                          Bookings are tied to your account. Sign in with OTP to see live slots and pay.
                        </p>
                        <Button variant="default" className="mt-3 h-10 w-full rounded-xl text-sm font-semibold" asChild>
                          <Link href="/login?next=/book-expert" onClick={() => trackEvent("book_expert_sign_in_click", { event_category: GA_CATEGORIES.conversion })}>
                            Sign in
                          </Link>
                        </Button>
                      </div>
                    )}

                    {/* Name + Phone */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="be-name" className="text-xs text-muted-foreground">
                          Full name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="be-name"
                          placeholder="Name on ID"
                          value={name}
                          onChange={(e) => { setName(e.target.value); trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "name" }); }}
                          className={cn("h-10 rounded-lg text-sm", inputCls)}
                          autoComplete="name"
                          disabled={!authed}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="be-phone" className="text-xs text-muted-foreground">
                          Mobile <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="be-phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit number"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "phone" }); }}
                          className={cn("h-10 rounded-lg text-sm", inputCls)}
                          autoComplete="tel"
                          disabled={!authed}
                        />
                      </div>
                    </div>
                    {phone.length > 0 && phoneDigits < 10 && (
                      <p className="text-xs text-amber-500">At least 10 digits (or leave blank to use account phone).</p>
                    )}
                    {authed && user?.phone && !phone.trim() && (
                      <p className="text-xs text-muted-foreground/70">Using phone from your account for checkout.</p>
                    )}

                    {/* Date */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Choose a date <span className="text-destructive">*</span>
                      </p>
                      <BookExpertCalendar
                        compact
                        value={date}
                        onChange={(d) => { setDate(d); trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "date" }); }}
                      />
                    </div>

                    {/* Time slots */}
                    <div className="space-y-1.5">
                      <p id="be-time-label" className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Time (IST) <span className="text-destructive">*</span>
                      </p>
                      {!authed ? (
                        <p className="rounded-lg border border-border bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                          Sign in to load available slots from the server.
                        </p>
                      ) : !date ? (
                        <p className="rounded-lg border border-border bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                          Pick a date first.
                        </p>
                      ) : slotsLoading ? (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-3 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                          Loading slots…
                        </div>
                      ) : slotsError ? (
                        <p className={cn("rounded-lg border px-3 py-2.5 text-xs", isDark ? "border-amber-500/20 bg-amber-500/8 text-amber-100/90" : "border-amber-200 bg-amber-50 text-amber-700")}>
                          {slotsError}
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-labelledby="be-time-label">
                          {slots.map((slot) => {
                            const active = selectedSlot?.slotStartTime === slot.slotStartTime && selectedSlot?.slotEndTime === slot.slotEndTime;
                            return (
                              <button
                                key={`${slot.slotStartTime}|${slot.slotEndTime}`}
                                type="button"
                                onClick={() => { setSelectedSlot(slot); trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "time" }); }}
                                className={cn(
                                  "min-h-10 rounded-lg border px-1.5 py-2 text-center text-xs font-semibold leading-tight transition-all",
                                  active
                                    ? "border-primary/50 bg-primary/15 text-primary"
                                    : "border-border bg-muted text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                )}
                              >
                                {slot.label.replace(" ", "\u00A0")}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <p className="text-xs leading-snug text-muted-foreground/70">
                      Slots update in real-time. We may message you before the call.
                    </p>

                    <Button
                      variant="default"
                      className="h-11 w-full gap-2 rounded-xl text-sm font-semibold"
                      size="default"
                      disabled={!ready || paying || !authed}
                      onClick={handlePay}
                    >
                      {paying ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Opening checkout…</>
                      ) : (
                        <><IndianRupee className="h-3.5 w-3.5" />Pay &amp; reserve</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground/70">Advice only · See terms at checkout</p>
                  </div>
                </motion.div>

                {/* Inline booking history */}
                {authed && <BookingHistoryMini bookings={bookings} isDark={isDark} />}
              </div>
            </aside>

            {/* ── Left content column ── */}
            <article className="order-2 min-w-0 lg:order-1 lg:col-span-7" aria-label="What to expect from your expert call">
              <div className={cn(cardDeep, "p-5 sm:p-7 lg:p-8")}>
                <div className="space-y-8 sm:space-y-9">

                  {/* What you get */}
                  <section className="space-y-3 sm:space-y-4" aria-labelledby="heading-included">
                    <SectionHeader id="heading-included" eyebrow="Session" title="What you get" />
                    <ul className="space-y-2.5 sm:space-y-3">
                      {OUTCOME_LINES.map((line) => (
                        <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                          </span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="h-px bg-border" role="presentation" />

                  {/* Confirmed + Join */}
                  <section className="grid gap-4 sm:grid-cols-2" aria-labelledby="heading-confirmed">
                    <div className="space-y-2">
                      <h3 id="heading-confirmed" className="font-display text-base font-semibold text-foreground">Get confirmed</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">We verify payment; you'll see status here and in email.</p>
                      <div className={cn("mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs", isDark ? "border-primary/20 bg-primary/8 text-blue-200" : "border-primary/20 bg-primary/5 text-primary")}>
                        <ReceiptText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        Meet link appears when your session is ready.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-base font-semibold text-foreground">Join the call</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">Meet link appears when your session is ready — same page, anytime.</p>
                    </div>
                  </section>

                  <div className="h-px bg-border" role="presentation" />

                  {/* How it works */}
                  <section className="space-y-4 sm:space-y-5" aria-labelledby="heading-flow">
                    <SectionHeader id="heading-flow" eyebrow="End-to-end" title="How every booking runs" />
                    <ol className="relative space-y-0 border-l border-primary/25 pl-6">
                      {FLOW_STEPS.map((item, i) => (
                        <li key={item.step} className={cn("relative pb-6 last:pb-0 sm:pb-7", i === 0 && "-mt-0.5")}>
                          <span
                            className={cn(
                              "absolute -left-6 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border text-xs font-bold text-primary",
                              isDark ? "border-primary/40 bg-zinc-950" : "border-primary/30 bg-background"
                            )}
                            aria-hidden
                          >
                            {item.step}
                          </span>
                          <p className="font-medium text-foreground sm:text-[1.0625rem]">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <div className="h-px bg-border" role="presentation" />

                  {/* FAQ */}
                  <section className="space-y-3 sm:space-y-4" aria-labelledby="heading-faq">
                    <SectionHeader id="heading-faq" eyebrow="FAQ" title="Quick answers" />
                    <div className="space-y-2 sm:space-y-2.5">
                      {FAQ_ITEMS.map((item) => (
                        <details
                          key={item.q}
                          className={cn(
                            "group rounded-xl border px-4 py-3 text-left [&_summary::-webkit-details-marker]:hidden sm:px-4 sm:py-3.5",
                            isDark ? "border-white/10 bg-zinc-950/40" : "border-border bg-muted/40"
                          )}
                        >
                          <summary className="cursor-pointer list-none text-sm font-medium text-foreground sm:text-[0.9375rem]">
                            <span className="flex items-center justify-between gap-2">
                              {item.q}
                              <span className="text-muted-foreground transition group-open:rotate-180">▼</span>
                            </span>
                          </summary>
                          <p className={cn("mt-2 border-t pt-2 text-sm leading-relaxed text-muted-foreground", isDark ? "border-white/5" : "border-border/50")}>
                            {item.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  </section>

                  <p className={cn("rounded-2xl border p-4 text-sm leading-relaxed text-muted-foreground", isDark ? "border-white/10 bg-zinc-900/55" : "border-border bg-muted/30")}>
                    Autolokate expert calls are guidance only — not financial, legal, or insurance advice. See checkout for reschedule and refund terms.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Cancel dialog */}
      <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {cancelTarget ? `${cancelTarget.slotDate} · ${cancelTarget.slotStartLabel}. Refunds follow platform rules if applicable.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setCancelTarget(null)}>Keep booking</Button>
            <Button type="button" variant="destructive" disabled={cancellingId !== null} onClick={() => void handleConfirmCancel()}>
              {cancellingId ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Cancelling…</>) : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
