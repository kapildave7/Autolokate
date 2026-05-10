"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CarFront,
  CheckCircle2,
  Download,
  Infinity as InfinityIcon,
  MessageCircle,
  Play,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/shared/page-fade";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE_NAME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

const CONTACT_BG_DARK = "/images/contach_bg_dark.png";
const CONTACT_BG_LIGHT = "/images/contact_bg_light.png";

const YT_VIDEO_ID = "8BL-2qFbWJY";
const YT_VIDEO_URL = `https://youtu.be/${YT_VIDEO_ID}`;
const YT_THUMBNAIL = `https://img.youtube.com/vi/${YT_VIDEO_ID}/maxresdefault.jpg`;
const YT_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`;

const heroStats: { icon: typeof Sparkles; label: string; value: string }[] = [
  { icon: Sparkles, label: "Quick Setup", value: "2 Minutes" },
  { icon: ShieldCheck, label: "Secure & Private", value: "100% Safe" },
  { icon: Users, label: "Community", value: "You're not alone" },
];

type Step = {
  icon: typeof CarFront;
  title: string;
  body: string;
  accent: string;
  iconBg: string;
  iconColor: string;
};

const steps: Step[] = [
  {
    icon: CarFront,
    title: "Vehicle Owner Setup",
    body: "Install the app, add your vehicle details, and generate your unique QR code in under a minute.",
    accent: "from-primary/30 to-sky-500/20",
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
  },
  {
    icon: ScanLine,
    title: "Initiating Contact",
    body: "A user scans the QR code or enters the license plate number from the app to reach the owner.",
    accent: "from-primary/30 to-sky-500/20",
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
  },
  {
    icon: MessageCircle,
    title: "Communication",
    body: "For emergencies, a group chat is initiated. Photos can be shared securely between everyone involved.",
    accent: "from-primary/30 to-sky-500/20",
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
  },
  {
    icon: BellRing,
    title: "Notification",
    body: "The vehicle owner and added emergency contacts receive an in-app notification instantly.",
    accent: "from-primary/30 to-sky-500/20",
    iconBg: "bg-primary/12",
    iconColor: "text-primary",
  },
];

type QrEdition = {
  id: "black" | "yellow";
  name: string;
  image: string;
  imageAlt: string;
  badges: string[];
  description: string;
  imageWrap: string;
};

const qrEditions: QrEdition[] = [
  {
    id: "black",
    name: "Black Edition",
    image: "/images/qr_b.png",
    imageAlt: "Autolokate Black Edition QR sticker",
    badges: ["TWO-WHEELER", "COMPACT"],
    description:
      "Perfectly sized for helmets, visors, or side panels. Discreet yet scannable from a comfortable distance.",
    imageWrap: "bg-zinc-900 ring-1 ring-white/10",
  },
  {
    id: "yellow",
    name: "Yellow Edition",
    image: "/images/qr_c.png",
    imageAlt: "Autolokate Yellow Edition QR sticker",
    badges: ["FOUR-WHEELER", "HIGH-VIS"],
    description:
      "Designed for windshields. Call or message space for police and parking-related requests.",
    imageWrap: "bg-yellow-400 ring-1 ring-yellow-300/40",
  },
];

const ctaPerks: { icon: typeof CheckCircle2; label: string }[] = [
  { icon: Wallet, label: "Free App Logic" },
  { icon: InfinityIcon, label: "Lifetime Validity" },
  { icon: ShieldCheck, label: "No Subscription" },
];

export function HowToUsePageClient() {
  const reduceMotion = useReducedMotion();
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <PageFade>
      <main className="relative">
        {/* ───────────────── Hero ───────────────── */}
        <section className="relative isolate overflow-hidden border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <Image
              src={CONTACT_BG_DARK}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-dark-only object-cover object-[75%_center]"
            />
            <Image
              src={CONTACT_BG_LIGHT}
              alt=""
              fill
              priority
              sizes="100vw"
              className="theme-light-only object-cover object-[75%_center]"
            />

            <div className="theme-dark-only absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/10" />
            <div
              className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.18),transparent_60%)]"
              aria-hidden
            />
            <div className="theme-light-only absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/10" />
            <div
              className="theme-light-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.10),transparent_60%)]"
              aria-hidden
            />

            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-secondary/40" />
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
                Simple Setup
              </span>

              <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                How to Use
                <br />
                <span className="bg-linear-to-r from-primary via-primary to-sky-500 bg-clip-text text-transparent">
                  {SITE_NAME} QR
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
                {SITE_NAME} QR is designed for simplicity. Follow these easy steps to secure your
                vehicle and connect with the community.
              </p>

              <ul className="mt-8 flex flex-wrap gap-3">
                {heroStats.map(({ icon: Icon, label, value }) => (
                  <li
                    key={label}
                    className="group flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2.5 shadow-app-soft backdrop-blur-md transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-[13.5px] font-semibold text-foreground">{value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ───────────────── Video Section ───────────────── */}
        <section className="relative bg-secondary/40 py-14 sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_15%,rgba(59,130,246,0.10),transparent_55%)]" />
            <div className="theme-light-only absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_25%_18%,rgba(59,130,246,0.06),transparent_55%)]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              }
              className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-app-soft"
            >
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                {/* Left copy */}
                <div className="flex flex-col justify-center gap-5 p-7 sm:p-9 lg:p-10">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                    Watch Video
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
                    How to Connect
                    <br />
                    <span className="bg-linear-to-r from-primary via-primary to-sky-500 bg-clip-text text-transparent">
                      {SITE_NAME} QR
                    </span>
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    Step-by-step guide to set up your {SITE_NAME} QR and connect instantly.
                  </p>

                  <div className="pt-1">
                    <Button size="lg" asChild>
                      <a href={YT_VIDEO_URL} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4" aria-hidden />
                        Watch on YouTube
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Right player */}
                <div className="relative isolate min-h-[260px] overflow-hidden bg-zinc-950 sm:min-h-[320px] lg:min-h-[360px]">
                  {videoPlaying ? (
                    <iframe
                      key="yt-iframe"
                      src={YT_EMBED_URL}
                      title={`${SITE_NAME} QR — How to use`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVideoPlaying(true)}
                      aria-label={`Play ${SITE_NAME} QR walkthrough`}
                      className="group absolute inset-0 flex items-center justify-center"
                    >
                      <Image
                        src={YT_THUMBNAIL}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <span
                        className="absolute inset-0 bg-linear-to-br from-zinc-950/65 via-zinc-950/35 to-zinc-950/55"
                        aria-hidden
                      />
                      <span
                        aria-hidden
                        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-primary shadow-[0_18px_44px_-14px_rgba(0,0,0,0.6)] ring-4 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-white sm:h-24 sm:w-24"
                      >
                        <Play className="ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ───────────────── 4 Steps ───────────────── */}
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Simple <span className="text-primary">4</span> Steps
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
                Follow these steps to get started with {SITE_NAME} QR.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, title, body, accent, iconBg, iconColor }, i) => {
                const stepNumber = String(i + 1).padStart(2, "0");
                return (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-90",
                        accent
                      )}
                    />
                    <div className="relative flex items-center justify-between">
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl",
                          iconBg,
                          iconColor
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-muted-foreground/40">
                        {stepNumber}
                      </span>
                    </div>
                    <h3 className="relative mt-5 text-[15px] font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="relative mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────────────── QR Editions ───────────────── */}
        <section className="bg-secondary/40 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Which QR Code Fits You?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
                Custom-engineered designs for every vehicle type.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {qrEditions.map((edition, i) => (
                <motion.div
                  key={edition.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-app-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-7"
                >
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                    <div
                      className={cn(
                        "relative flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-3 shadow-inner sm:h-40 sm:w-40",
                        edition.imageWrap
                      )}
                    >
                      <Image
                        src={edition.image}
                        alt={edition.imageAlt}
                        width={320}
                        height={640}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        {edition.name}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        {edition.badges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center rounded-full border border-border/70 bg-secondary/70 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                        {edition.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────── CTA Banner ───────────────── */}
        <section className="bg-background pb-20 pt-6 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-sky-600 p-8 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.6)] sm:p-10">
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-20"
                aria-hidden
              >
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute -bottom-12 right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
              </div>

              <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Ready to Secure
                    <br className="hidden sm:block" /> Your Range?
                  </h2>
                </div>

                <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:items-end">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      className="border border-transparent bg-white text-primary shadow-md hover:bg-white/90 hover:text-primary"
                      asChild
                    >
                      <Link href="/download">
                        <Download className="h-4 w-4" aria-hidden />
                        Download App
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
                      asChild
                    >
                      <Link href="/contact">
                        <QrCode className="h-4 w-4" aria-hidden />
                        Buy QR Stickers
                      </Link>
                    </Button>
                  </div>

                  <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/85">
                    {ctaPerks.map(({ icon: Icon, label }) => (
                      <li key={label} className="inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Helper link */}
            <div className="mt-8 text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:underline"
              >
                Need help? Contact our team
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
