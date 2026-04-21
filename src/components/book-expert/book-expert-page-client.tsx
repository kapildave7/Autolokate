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
  Gauge,
  Headphones,
  IndianRupee,
  KeyRound,
  Loader2,
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
  canCancelBooking,
  isPendingPaymentBooking,
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
    title: "Built for Indian buyers",
    body: "Traffic, fuel prices, service networks, and resale — not generic global reviews.",
  },
  {
    title: "No dealer playbook",
    body: "We don’t earn from showrooms. The session is aligned to your shortlist and budget only.",
  },
  {
    title: "One transparent fee",
    body: "Pay once via Razorpay. Amount is confirmed at checkout; GST included in the offer you see.",
  },
] as const;

const FLOW_STEPS = [
  { step: "1", title: "Sign in", text: "OTP login links bookings and payments to your account." },
  { step: "2", title: "Pick a slot", text: "Choose date & time from live availability." },
  { step: "3", title: "Pay on Razorpay", text: "UPI, cards, or wallets — order created for your booking." },
  { step: "4", title: "Get confirmed", text: "We verify payment; you’ll see status here and in email." },
  { step: "5", title: "Join the call", text: "Meet link appears when your session is ready — same page, anytime." },
] as const;

const FAQ_ITEMS = [
  {
    q: "Can I book more than one session?",
    a: "Yes. Each slot is a separate booking and payment. Manage them all under Your bookings.",
  },
  {
    q: "Payment didn’t finish — what now?",
    a: "Open Your bookings and tap Complete payment on the pending row. Same slot is held until checkout completes or you cancel.",
  },
  {
    q: "How do I cancel?",
    a: "Use Cancel on a booking card when eligible. Refunds follow the policy shown at checkout.",
  },
  {
    q: "Is this financial or legal advice?",
    a: "No — it’s practical car-buying guidance. For loans, insurance, or contracts, consult licensed professionals.",
  },
] as const;

const surface =
  "rounded-2xl border border-white/10 bg-zinc-900/55 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_12px_40px_-28px_rgba(0,0,0,0.45)]";
const inputDark =
  "border-zinc-600/80 bg-zinc-950/95 text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:border-emerald-400/55 focus-visible:ring-emerald-500/25";

const sectionEyebrow = "text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 sm:tracking-[0.2em]";
const sectionTitle = "font-display text-xl font-semibold tracking-tight text-white sm:text-2xl";

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <header className="space-y-1.5 sm:space-y-2">
      <p className={sectionEyebrow}>{eyebrow}</p>
      <h2 id={id} className={sectionTitle}>
        {title}
      </h2>
    </header>
  );
}

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
          className={cn("absolute text-emerald-500/9", className)}
          initial={reduceMotion ? false : { y: 0, opacity: 0.5 }}
          animate={reduceMotion ? undefined : { y: [0, -10, 0], opacity: [0.45, 0.65, 0.45] }}
          transition={{
            duration: 7 + i * 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        >
          <Icon strokeWidth={1.15} className="drop-shadow-[0_0_28px_rgba(16,185,129,0.12)]" style={{ width: size, height: size }} />
        </motion.div>
      ))}
    </div>
  );
}

export function BookExpertPageClient() {
  const reduceMotion = useReducedMotion();
  const { pay, paying, completePaymentForBooking } = useExpertBookingPayment();
  const user = useAuthStore((s) => s.user);
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<ExpertTimeSlot | null>(null);
  const [slots, setSlots] = useState<ExpertTimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<UserBookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [resumingBookingId, setResumingBookingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<UserBookingSummary | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const authed = hasAuthTokens();
  const effectivePhone = phone.trim() || (user?.phone ? String(user.phone) : "");
  const effectiveName = name.trim() || (user?.full_name ? String(user.full_name) : "");
  const contactReadyForPayment = Boolean(
    authed && effectiveName.length > 0 && digitsOnly(effectivePhone).length >= 10
  );
  const phoneDigits = phone.replace(/\D/g, "").length;
  const pendingBookings = myBookings.filter(isPendingPaymentBooking);
  const ready = Boolean(contactReadyForPayment && date && selectedSlot);

  const loadBookings = useCallback(async () => {
    if (!hasAuthTokens()) {
      setMyBookings([]);
      return;
    }
    setBookingsLoading(true);
    try {
      const raw = await getMyBookings();
      setMyBookings(normalizeMyBookings(raw));
    } catch {
      setMyBookings([]);
    } finally {
      setBookingsLoading(false);
    }
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

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!date || !authed) {
      setSlots([]);
      setSelectedSlot(null);
      setSlotsError(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    (async () => {
      try {
        const raw = await getBookingSlotsByDate(date);
        if (cancelled) return;
        const next = normalizeSlotsForDate(raw, date);
        setSlots(next);
        if (next.length === 0) {
          setSlotsError("No open slots on this day — try another date.");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof ApiError ? err.message : "Could not load slots.";
          setSlotsError(msg);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, authed]);

  const handlePay = async () => {
    if (!ready || !selectedSlot) return;
    trackEvent("book_call_click", {
      event_category: GA_CATEGORIES.conversion,
      price: SESSION_FEE,
      source: "book_expert_page",
      provider: "razorpay",
    });
    await pay({
      name: effectiveName,
      phone: effectivePhone,
      slotDate: date,
      slot: selectedSlot,
    });
    void loadBookings();
  };

  const handleCompletePendingPayment = async (b: UserBookingSummary) => {
    if (!authed || paying) return;
    if (!contactReadyForPayment) {
      toast.error("Add your name and mobile number above (or save them on your account).");
      return;
    }
    trackEvent("book_expert_resume_payment_click", {
      event_category: GA_CATEGORIES.conversion,
      booking_id: b.id,
    });
    setResumingBookingId(b.id);
    try {
      await completePaymentForBooking({
        bookingId: b.id,
        name: effectiveName,
        phone: effectivePhone,
        slotDate: b.slotDate,
        timeLabel: b.slotStartLabel,
      });
    } finally {
      setResumingBookingId(null);
    }
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
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#050506] text-zinc-100 antialiased scheme-dark"
      data-book-expert-page
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-25%,rgba(16,185,129,0.16),transparent_58%)]" />
        <div className="absolute -left-[18%] top-0 h-[62vh] w-[75vw] rounded-full bg-emerald-500/9 blur-[140px]" />
        <div className="absolute -right-[10%] top-[14%] h-[45vh] w-[55vw] rounded-full bg-teal-400/7 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[40vh] w-[98vw] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[115px]" />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <FloatingIcons reduceMotion={reduceMotion} />

      <main className="relative">
        <section
          className="border-b border-white/8 px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-5"
          aria-labelledby="book-expert-heading"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              <div>
                <p className={cn(sectionEyebrow, "text-emerald-300")}>Expert call</p>
                <h1
                  id="book-expert-heading"
                  className="font-display mt-2.5 max-w-3xl text-3xl font-bold leading-[1.08] tracking-tight text-white sm:mt-3 sm:text-4xl sm:leading-[1.05] lg:text-[2.75rem]"
                >
                  A clear car decision
                  <span className="mt-1 block bg-linear-to-r from-emerald-200 via-emerald-400 to-teal-300 bg-clip-text text-transparent sm:mt-0">
                    in 15 minutes.
                  </span>
                </h1>
                <div className="mt-4 h-px max-w-lg bg-linear-to-r from-emerald-500/55 via-emerald-400/25 to-transparent sm:mt-5" />
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:mt-5 sm:text-base">
                  One session with an Autolokate advisor — same practical lens as{" "}
                  <span className="text-zinc-100">Indian Drive Guide</span> /{" "}
                  <span className="text-emerald-200/95">Deepak Chaudhary</span>. Flat fee, no dealer kickbacks.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100/95 sm:px-3.5">
                    <Headphones className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    15 min · live
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 sm:px-3.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-zinc-300" aria-hidden />
                    Razorpay
                  </span>
                </div>
                <div className="mt-6 sm:mt-7">
                  <Button variant="expert" className="h-11 rounded-xl px-6 text-sm font-semibold shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/20" asChild>
                    <a href="#book-session">Book a session — pick a slot</a>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { icon: Clock, k: "15 min", s: "Structured call" },
                  { icon: IndianRupee, k: `From ₹${SESSION_FEE}`, s: "GST included · server-priced at checkout" },
                ].map(({ icon: Icon, k, s }) => (
                  <div
                    key={k}
                    className={cn(
                      surface,
                      "flex items-center gap-3 border-emerald-500/10 bg-linear-to-br from-zinc-900/80 to-zinc-950/50 px-4 py-4 ring-1 ring-white/5"
                    )}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/15">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold tabular-nums text-white sm:text-lg">{k}</p>
                      <p className="mt-0.5 text-xs leading-snug text-zinc-300 sm:text-sm">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/8 px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="why-book">
          <div className="mx-auto max-w-6xl">
            <p id="why-book" className={cn(sectionEyebrow, "text-center text-emerald-300/90")}>
              Why book a session
            </p>
            <h2 className="font-display mx-auto mt-2 max-w-2xl text-center text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">
              Clarity that pays for itself
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-zinc-400 sm:mt-3 sm:text-base">
              One short call can save weeks of forum rabbit holes — and costly variant or timing mistakes.
            </p>
            <div className="mt-8 grid gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-4">
              {VALUE_PILLARS.map((p) => (
                <div
                  key={p.title}
                  className={cn(
                    surface,
                    "border-emerald-500/10 bg-linear-to-b from-zinc-900/90 to-zinc-950/80 p-5 ring-1 ring-white/5"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-emerald-400/90" aria-hidden />
                  <p className="mt-3 font-display text-base font-semibold text-white sm:text-[1.0625rem]">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="relative border-b border-white/8 px-4 py-8 sm:px-6 sm:py-10"
          aria-labelledby="founder-heading"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(16,185,129,0.08),transparent_55%)]" aria-hidden />
          <div className="relative mx-auto max-w-6xl">
            <div
              className={cn(
                "overflow-hidden rounded-3xl border border-white/12 bg-linear-to-br from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-emerald-500/10 backdrop-blur-sm sm:p-7 lg:p-9"
              )}
            >
              <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,300px)_1fr]">
                <div className="mx-auto flex w-full max-w-[280px] flex-col items-center lg:mx-0 lg:max-w-none">
                  <div className="relative w-full max-w-[240px] sm:max-w-[260px] lg:max-w-none">
                    <div
                      className="pointer-events-none absolute -inset-3 rounded-full bg-linear-to-br from-emerald-400/25 via-teal-500/15 to-transparent blur-2xl"
                      aria-hidden
                    />
                    <div className="relative aspect-square overflow-hidden rounded-full border border-white/15 bg-zinc-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500/20">
                      <Image
                        src={IDG_FOUNDER.avatarUrl}
                        alt={`${IDG_FOUNDER.name}, ${IDG_FOUNDER.title}`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 260px, 300px"
                        priority
                      />
                    </div>
                    <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90 sm:mt-4 sm:tracking-[0.2em] lg:text-left">
                      Session lead
                    </p>
                  </div>
                </div>

                <div className="min-w-0 space-y-4 sm:space-y-5">
                  <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                      Indian Drive Guide
                    </span>
                  <header className="space-y-1.5 pt-0.5 sm:space-y-2">
                    <h2 id="founder-heading" className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Deepak Chaudhary
                    </h2>
                    <p className="text-sm font-medium text-emerald-200/90 sm:text-base">Founder — practical guidance for Indian buyers</p>
                  </header>
                  <p className="text-sm leading-relaxed text-zinc-300 sm:text-[0.9375rem]">
                    Sessions follow the same approach as the channel: shortlist, budget, ownership reality — straight talk,
                    no scripts.
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
                        onClick={() =>
                          trackEvent("book_expert_idg_channel_click", {
                            event_category: GA_CATEGORIES.media,
                            source: "founder_section",
                          })
                        }
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

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
            <aside
              className="order-1 min-w-0 lg:order-2 lg:col-span-5 lg:flex lg:max-h-[calc(100svh-4rem)] lg:min-h-0 lg:flex-col lg:self-start lg:sticky lg:top-16"
              aria-labelledby="book-session-title"
            >
              <h2 id="book-session-title" className="sr-only">
                Reserve and pay for your session
              </h2>
              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                id="book-session"
                className={cn(
                  "flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900/88 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.75),0_0_0_1px_rgba(16,185,129,0.07)] backdrop-blur-xl",
                  "ring-1 ring-emerald-500/10"
                )}
              >
                <div className="relative shrink-0 border-b border-white/8 bg-linear-to-br from-zinc-900/98 via-zinc-950/95 to-zinc-950 px-4 py-3.5 sm:px-5">
                  <div
                    className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/25 to-transparent"
                    aria-hidden
                  />
                  <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">Reserve a slot</p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-snug text-zinc-400">
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500/85" strokeWidth={2.5} aria-hidden />
                          Email recap after the call
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500/85" strokeWidth={2.5} aria-hidden />
                          UPI · cards · wallets
                        </li>
                      </ul>
                    </div>
                    <div className="shrink-0 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-right shadow-[0_8px_24px_-12px_rgba(16,185,129,0.35)] sm:px-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/95 sm:text-xs">From</p>
                      <p className="font-display text-2xl font-bold tabular-nums leading-none text-white sm:text-[1.75rem]">₹{SESSION_FEE}</p>
                      <p className="mt-1 text-xs text-zinc-400">Final total at Razorpay · GST incl.</p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-4">
                  {!authed ? (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-xs leading-snug text-amber-100/95 sm:text-[0.8125rem]">
                      <p className="font-semibold text-amber-50">Sign in required</p>
                      <p className="mt-1.5 text-amber-100/85">
                        Bookings are tied to your account. Sign in with OTP to see live slots and pay.
                      </p>
                      <Button
                        variant="expert"
                        className="mt-3 h-10 w-full text-sm font-semibold"
                        asChild
                      >
                        <Link
                          href="/login?next=/book-expert"
                          onClick={() =>
                            trackEvent("book_expert_sign_in_click", { event_category: GA_CATEGORIES.conversion })
                          }
                        >
                          Sign in to continue
                        </Link>
                      </Button>
                    </div>
                  ) : null}

                  {authed && (bookingsLoading || myBookings.length > 0) ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3.5 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">Your bookings</p>
                      {bookingsLoading ? (
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" aria-hidden />
                          Loading…
                        </div>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {myBookings.map((b) => {
                            const pending = isPendingPaymentBooking(b);
                            return (
                              <li
                                key={b.id}
                                className="rounded-lg border border-white/8 bg-zinc-950/50 px-3 py-2.5 text-xs leading-snug text-zinc-200"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <span
                                      className={cn(
                                        "inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:text-xs",
                                        pending
                                          ? "bg-amber-500/20 text-amber-200"
                                          : "bg-emerald-500/15 text-emerald-200/95"
                                      )}
                                    >
                                      {pending ? "Payment pending" : (b.status || "booking").replace(/_/g, " ")}
                                    </span>
                                    <p className="mt-1.5 font-medium text-zinc-100">{b.slotDate}</p>
                                    <p className="text-zinc-400">{b.slotStartLabel}</p>
                                  </div>
                                </div>
                                {pending ? (
                                  <Button
                                    type="button"
                                    variant="expert"
                                    className="mt-3 h-10 w-full text-sm font-semibold"
                                    disabled={!contactReadyForPayment || paying}
                                    onClick={() => void handleCompletePendingPayment(b)}
                                  >
                                    {paying && resumingBookingId === b.id ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                        Opening checkout…
                                      </>
                                    ) : (
                                      <>
                                        <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                                        Complete payment
                                      </>
                                    )}
                                  </Button>
                                ) : b.meetLink ? (
                                  <a
                                    href={b.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 text-emerald-300 underline underline-offset-2"
                                  >
                                    <Video className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    Join call
                                  </a>
                                ) : null}
                                {canCancelBooking(b) ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="mt-2 h-9 w-full border border-white/10 bg-transparent text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                    onClick={() => setCancelTarget(b)}
                                  >
                                    Cancel booking
                                  </Button>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {pendingBookings.length > 0 ? (
                        <p className="mt-2 text-xs leading-snug text-amber-200/85">
                          Pending payments: use Complete payment on the row above. You can still book another slot
                          below.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="be-name" className="text-xs text-zinc-400">
                        Full name
                      </Label>
                      <Input
                        id="be-name"
                        placeholder="Name on ID"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "name" });
                        }}
                        className={cn("h-10 rounded-lg text-sm", inputDark)}
                        autoComplete="name"
                        disabled={!authed}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="be-phone" className="text-xs text-zinc-400">
                        Mobile
                      </Label>
                      <Input
                        id="be-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "phone" });
                        }}
                        className={cn("h-10 rounded-lg text-sm", inputDark)}
                        autoComplete="tel"
                        disabled={!authed}
                      />
                    </div>
                  </div>
                  {phone.length > 0 && phoneDigits < 10 ? (
                    <p className="text-xs text-amber-400/90">At least 10 digits (or leave blank to use account phone).</p>
                  ) : null}
                  {authed && user?.phone && !phone.trim() ? (
                    <p className="text-xs text-zinc-500">Using phone from your account for checkout.</p>
                  ) : null}

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Date</p>
                    <BookExpertCalendar
                      compact
                      value={date}
                      onChange={(d) => {
                        setDate(d);
                        trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "date" });
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p id="be-time-label" className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                      Time (IST)
                    </p>
                    {!authed ? (
                      <p className="rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2.5 text-xs text-zinc-400">
                        Sign in to load available slots from the server.
                      </p>
                    ) : !date ? (
                      <p className="rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-2.5 text-xs text-zinc-400">
                        Pick a date first.
                      </p>
                    ) : slotsLoading ? (
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/50 px-3 py-3 text-xs text-zinc-300">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" aria-hidden />
                        Loading slots…
                      </div>
                    ) : slotsError ? (
                      <p className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-100/90">
                        {slotsError}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-labelledby="be-time-label">
                        {slots.map((slot) => {
                          const active =
                            selectedSlot?.slotStartTime === slot.slotStartTime &&
                            selectedSlot?.slotEndTime === slot.slotEndTime;
                        return (
                          <button
                              key={`${slot.slotStartTime}|${slot.slotEndTime}`}
                            type="button"
                            onClick={() => {
                                setSelectedSlot(slot);
                              trackEvent("help_form_input", { event_category: GA_CATEGORIES.forms, field: "time" });
                            }}
                            className={cn(
                              "min-h-10 rounded-lg border px-1.5 py-2 text-center text-xs font-semibold leading-tight transition-all",
                              active
                                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                                : "border-white/10 bg-zinc-950/60 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                            )}
                          >
                              {slot.label.replace(" ", "\u00A0")}
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </div>

                  <p className="text-xs leading-snug text-zinc-500">
                    We may message you on this number before the call.
                  </p>

                  <Button
                    variant="expert"
                    className="h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/35 ring-1 ring-emerald-400/15"
                    size="default"
                    disabled={!ready || paying || !authed}
                    onClick={handlePay}
                  >
                    {paying ? (
                      "Opening checkout…"
                    ) : (
                      <>
                        <IndianRupee className="h-3.5 w-3.5" />
                        Pay &amp; reserve
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-zinc-500">Advice only · see terms at checkout</p>
                </div>
              </motion.div>
            </aside>

            <article
              className="order-2 min-w-0 space-y-0 lg:order-1 lg:col-span-7"
              aria-label="What to expect from your expert call"
            >
              <div className="rounded-3xl border border-white/12 bg-zinc-900/45 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_24px_60px_-40px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-md sm:p-7 lg:p-8">
                <div className="space-y-8 sm:space-y-9">
                  <section className="space-y-3 sm:space-y-4" aria-labelledby="heading-included">
                    <SectionHeader id="heading-included" eyebrow="Session" title="What you get" />
                    <ul className="space-y-2.5 sm:space-y-3">
                      {OUTCOME_LINES.map((line) => (
                        <li key={line} className="flex gap-3 text-sm leading-relaxed text-zinc-200 sm:text-[0.9375rem]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                          </span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" role="presentation" />

                  <section className="space-y-4 sm:space-y-5" aria-labelledby="heading-flow">
                    <SectionHeader id="heading-flow" eyebrow="End-to-end" title="How every booking runs" />
                    <ol className="relative space-y-0 border-l border-emerald-500/25 pl-6">
                      {FLOW_STEPS.map((item, i) => (
                        <li key={item.step} className={cn("relative pb-6 last:pb-0 sm:pb-7", i === 0 && "-mt-0.5")}>
                          <span
                            className="absolute -left-6 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-emerald-500/40 bg-zinc-950 text-xs font-bold text-emerald-300"
                            aria-hidden
                          >
                            {item.step}
                          </span>
                          <p className="font-medium text-white sm:text-[1.0625rem]">{item.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.text}</p>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" role="presentation" />

                  <section className="space-y-3 sm:space-y-4" aria-labelledby="heading-faq">
                    <SectionHeader id="heading-faq" eyebrow="FAQ" title="Quick answers" />
                    <div className="space-y-2 sm:space-y-2.5">
                      {FAQ_ITEMS.map((item) => (
                        <details
                          key={item.q}
                          className="group rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-left [&_summary::-webkit-details-marker]:hidden sm:px-4 sm:py-3.5"
                        >
                          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-100 sm:text-[0.9375rem]">
                            <span className="flex items-center justify-between gap-2">
                              {item.q}
                              <span className="text-zinc-500 transition group-open:rotate-180">▼</span>
                            </span>
                          </summary>
                          <p className="mt-2 border-t border-white/5 pt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>

                  <p className={cn(surface, "p-4 text-sm leading-relaxed text-zinc-500")}>
                    Autolokate expert calls are guidance only — not financial, legal, or insurance advice. See checkout for
                    reschedule and refund terms.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="border-white/12 bg-zinc-950 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">Cancel this booking?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {cancelTarget
                ? `${cancelTarget.slotDate} · ${cancelTarget.slotStartLabel}. Refunds follow platform rules if applicable.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              onClick={() => setCancelTarget(null)}
            >
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-500"
              disabled={cancellingId !== null}
              onClick={() => void handleConfirmCancel()}
            >
              {cancellingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Cancelling…
                </>
              ) : (
                "Yes, cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
