"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Infinity as InfinityIcon,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/shared/page-fade";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE_NAME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

/* ─────────────── Constants ─────────────── */

const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.mycompany.indiandriveguide";
const IOS_URL = "https://apps.apple.com/in/app/idg-autolokate/id6733244175";

const HERO_BG_DARK = "/images/download_bg_dark.png";
const HERO_BG_LIGHT = "/images/download_bg_light.png";

/* ─────────────── Brand Glyphs (lucide doesn't ship these) ─────────────── */

function GooglePlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={className}>
      <path
        d="M325.3 234.3 104.3 13.3l219.2 126.6-83.7 94.4 85.5 0z"
        fill="#34A853"
      />
      <path
        d="M104.3 13.3a36 36 0 0 0-19 31.2v423a36 36 0 0 0 19 31.2L325.3 277.7l-83.6-94.4-137.4-169.9z"
        fill="#4285F4"
      />
      <path
        d="M325.3 277.7 104.3 498.7l219.2-126.6 83.7-94.4-81.9 0z"
        fill="#FBBC05"
      />
      <path
        d="m407.2 277.7 80.7-46.6c19-11 19-39.1 0-50.1l-80.7-46.6-83.6 94.4 83.6 48.9z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" aria-hidden fill="currentColor" className={className}>
      <path d="M318.7 268.7c-.3-36.7 16.4-64.4 50.2-84.8-18.9-27-47.5-41.9-85.2-44.8-35.7-2.8-74.7 21.1-89 21.1-15.1 0-49.7-20.1-76.8-20.1C70.8 141.6 16 184.3 16 271.5c0 25.8 4.7 52.4 14.1 79.7 12.6 36 56.4 124 102.1 122.5 24-.5 40.9-17 72.2-17 30.4 0 46 17 72.7 17 46.1-.7 85.7-80.6 97.7-116.7-64.4-30.4-56.1-89-56.1-87.3zM254.6 96.3c30.9-36.7 28.1-70.1 27.2-82.1-27.4 1.6-59.1 18.7-77.2 39.7-19.9 22.5-31.6 50.3-29.1 81.5 29.7 2.3 56.8-13 79.1-39.1z" />
    </svg>
  );
}

/* ─────────────── Data ─────────────── */

type FeatureCard = {
  icon: typeof FileText;
  title: string;
  body: string;
  badges: string[];
  iconBg: string;
  iconColor: string;
  glow: string;
};

const featureCards: FeatureCard[] = [
  {
    icon: FileText,
    title: "Digital Garage",
    body: "Never miss a renewal. Digitize RC, Insurance, and PUC. Get timely alerts for expiry and service due dates.",
    badges: ["EXPIRY REMINDERS", "SERVICE HISTORY", "EXPENSE LOG"],
    iconBg: "bg-blue-500/12",
    iconColor: "text-blue-500",
    glow: "from-blue-500/30 to-sky-500/20",
  },
  {
    icon: QrCode,
    title: `${SITE_NAME} QR`,
    body: `Stop displaying your phone number on the dashboard. Use our ${SITE_NAME} QR Stickers for private parking contact.`,
    badges: ["NUMBER HIDDEN", "SCAN TO CHAT", "CALL MASKING"],
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
    glow: "from-primary/30 to-sky-500/20",
  },
  {
    icon: Users,
    title: "Expert Community",
    body: "Stuck with a car problem? Ask our community of 2M+ owners and mechanics for instant, verified solutions.",
    badges: ["MECHANIC ANSWERS", "DIY GUIDES", "OWNER REVIEWS"],
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
    glow: "from-primary/30 to-sky-500/20",
  },
];

type QrEdition = {
  id: "two-wheeler" | "four-wheeler";
  label: string;
  image: string;
  imageAlt: string;
  imageWrap: string;
};

const qrEditions: QrEdition[] = [
  {
    id: "two-wheeler",
    label: "TWO WHEELER",
    image: "/images/qr_b.png",
    imageAlt: `${SITE_NAME} QR sticker for two-wheelers`,
    imageWrap: "bg-zinc-900 ring-1 ring-white/10",
  },
  {
    id: "four-wheeler",
    label: "FOUR WHEELER",
    image: "/images/qr_c.png",
    imageAlt: `${SITE_NAME} QR sticker for four-wheelers`,
    imageWrap: "bg-yellow-400 ring-1 ring-yellow-300/40",
  },
];

const ctaPerks: { icon: typeof CheckCircle2; label: string }[] = [
  { icon: Wallet, label: "Free Core App" },
  { icon: InfinityIcon, label: "Lifetime Validity" },
  { icon: ShieldCheck, label: "Privacy First" },
];

/* ─────────────── Reusable Store Badge ─────────────── */

function StoreBadge({
  href,
  topLabel,
  bottomLabel,
  icon,
  className,
}: {
  href: string;
  topLabel: string;
  bottomLabel: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${topLabel} ${bottomLabel}`}
      className={cn(
        "group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-2xl px-5",
        "border border-white/15 bg-zinc-950 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-zinc-900",
        "dark:border-white/12 dark:bg-zinc-900 dark:hover:bg-zinc-800",
        "sm:h-[3.75rem] sm:px-6",
        className
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center sm:h-8 sm:w-8">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[10px]">
          {topLabel}
        </span>
        <span className="font-display -mt-0.5 text-[15px] font-bold tracking-tight text-white sm:text-[17px]">
          {bottomLabel}
        </span>
      </span>
    </a>
  );
}

/* ─────────────── Page ─────────────── */

export function DownloadPageClient() {
  const reduceMotion = useReducedMotion();

  return (
    <PageFade>
      <main className="relative">
        {/* ──────────── Hero ──────────── */}
        <section className="relative isolate overflow-hidden border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={HERO_BG_DARK}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-dark-only object-cover object-[78%_center]"
            />
            <Image
              src={HERO_BG_LIGHT}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-light-only object-cover object-[78%_center]"
            />

            {/* Dark theme overlays */}
            <div className="theme-dark-only absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/10" />
            <div
              className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.18),transparent_60%)]"
              aria-hidden
            />

            {/* Light theme overlays */}
            <div className="theme-light-only absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/10" />
            <div
              className="theme-light-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.10),transparent_60%)]"
              aria-hidden
            />

            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-background" />
          </div>

          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="max-w-2xl"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-primary/30",
                  "bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary backdrop-blur-sm"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                One App for Total Safety
              </span>

              <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                Safety &amp; Privacy
                <br />
                <span className="bg-linear-to-r from-primary via-primary to-sky-500 bg-clip-text text-transparent">
                  For Your Vehicle
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
                From emergency alerts to solving wrong parking without sharing your number. The only
                automotive app you need for Indian roads.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <StoreBadge
                  href={ANDROID_URL}
                  topLabel="Get it on"
                  bottomLabel="Google Play"
                  icon={<GooglePlayGlyph className="h-7 w-7 sm:h-8 sm:w-8" />}
                />
                <StoreBadge
                  href={IOS_URL}
                  topLabel="Download on the"
                  bottomLabel="App Store"
                  icon={<AppleGlyph className="h-7 w-7 sm:h-8 sm:w-8 text-white" />}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ──────────── Trust Stats Heading ──────────── */}
        <section className="bg-background pb-2 pt-14 sm:pt-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[2rem] lg:text-[2.25rem]"
            >
              Why{" "}
              <span className="bg-linear-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                2 Million+
              </span>{" "}
              Drivers Trust Us?
            </motion.h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-[15px]">
              Essential tools designed specifically for the Indian road ecosystem.
            </p>
          </div>
        </section>

        {/* ──────────── Feature Cards ──────────── */}
        <section className="bg-background py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(
                ({ icon: Icon, title, body, badges, iconBg, iconColor, glow }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-7"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-90",
                        glow
                      )}
                    />

                    <span
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-xl",
                        iconBg,
                        iconColor
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>

                    <h3 className="font-display relative mt-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                      {title}
                    </h3>
                    <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">
                      {body}
                    </p>

                    <ul className="relative mt-5 flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <li
                          key={badge}
                          className="inline-flex items-center rounded-md border border-border/70 bg-secondary/60 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground/80"
                        >
                          {badge}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ──────────── QR Stickers Section ──────────── */}
        <section className="bg-background pb-16 pt-4 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className={cn(
                "relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-app-soft"
              )}
            >
              {/* Decorative glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"
              />

              <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:p-12">
                {/* Left copy */}
                <div className="flex flex-col justify-center">
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-2 rounded-full border border-primary/30",
                      "bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Physical Product
                  </span>

                  <h2 className="font-display mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.25rem]">
                    <span className="text-foreground">Get Premium </span>
                    <span className="bg-linear-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                      QR
                    </span>
                    <br />
                    <span className="bg-linear-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                      Stickers
                    </span>
                    <span className="text-foreground"> Delivered</span>
                  </h2>

                  <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    High-quality, weatherproof QR for your car or bike. Enable{" "}
                    <span className="font-semibold text-primary">private contact</span> regarding
                    parking issues and emergencies.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button size="lg" asChild>
                      <Link href="/contact">
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                        Order Stickers Now
                      </Link>
                    </Button>
                  </div>

                  <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-muted-foreground">
                    {ctaPerks.map(({ icon: Icon, label }) => (
                      <li key={label} className="inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right QR cards */}
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  {qrEditions.map((edition, i) => (
                    <motion.div
                      key={edition.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
                      }
                      className="flex flex-col items-center"
                    >
                      <div
                        className={cn(
                          "relative flex aspect-3/4 w-full items-center justify-center overflow-hidden rounded-2xl p-3 shadow-app-soft sm:p-4",
                          edition.imageWrap
                        )}
                      >
                        <Image
                          src={edition.image}
                          alt={edition.imageAlt}
                          width={320}
                          height={420}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        {edition.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Helper link */}
            <div className="mt-8 text-center">
              <Link
                href="/how-to-use"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:underline"
              >
                Learn how to use {SITE_NAME} QR
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
