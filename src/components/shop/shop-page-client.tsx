"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Check,
  Clock,
  Crown,
  IndianRupee,
  Leaf,
  Package,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/shared/page-fade";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE_NAME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

const HERO_BG_DARK = "/images/download_bg_dark.png";
const HERO_BG_LIGHT = "/images/download_bg_light.png";

type PriceTier = {
  id: string;
  label: string;
  price: number;
  mrp: number;
};

type ShopProduct = {
  key: "bike" | "car";
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  ringClass: string;
  badges: string[];
  highlightBadge?: string;
  tiers: PriceTier[];
  bullets: string[];
};

const products: ShopProduct[] = [
  {
    key: "bike",
    title: "QR Code for Bike",
    description:
      "Sized for two-wheelers: weatherproof vinyl, crisp scan contrast, and a finish that holds up on daily commutes.",
    image: "/images/qr_b.png",
    imageAlt: `${SITE_NAME} QR sticker for two-wheelers`,
    ringClass: "bg-zinc-900 ring-2 ring-white/15",
    badges: ["TWO-WHEELER"],
    highlightBadge: "POPULAR",
    tiers: [
      { id: "single", label: "Single", price: 299, mrp: 1199 },
      { id: "double", label: "Double", price: 549, mrp: 2198 },
      { id: "triple", label: "Triple", price: 799, mrp: 3297 },
    ],
    bullets: [
      "Compact 2×4 inch design",
      "UV-protected coating",
      "Strong adhesive for curved panels",
      "Works with the free app",
    ],
  },
  {
    key: "car",
    title: "QR Code for Car",
    description:
      "Larger format for four-wheelers: high-visibility yellow field, premium lamination, and a confident windshield presence.",
    image: "/images/qr_c.png",
    imageAlt: `${SITE_NAME} QR sticker for cars`,
    ringClass: "bg-yellow-400 ring-2 ring-yellow-300/50",
    badges: ["FOUR-WHEELER"],
    highlightBadge: "PREMIUM",
    tiers: [
      { id: "single", label: "Single", price: 499, mrp: 1999 },
      { id: "double", label: "Double", price: 899, mrp: 3998 },
      { id: "triple", label: "Triple", price: 1299, mrp: 5997 },
    ],
    bullets: [
      "High-contrast yellow plate",
      "Scratch-resistant lamination",
      "Tuned for windshields & glass",
      "Private scan-to-chat flow",
    ],
  },
];

const heroPerks: { icon: typeof Shield; label: string }[] = [
  { icon: Zap, label: "Instant alert system" },
  { icon: Shield, label: "Privacy protected" },
  { icon: Package, label: "No phone number on display" },
  { icon: Truck, label: "Tracked delivery" },
];

const valueProps: { icon: typeof Shield; title: string; body: string }[] = [
  {
    icon: Shield,
    title: "Privacy first",
    body: "You choose what scanners see — no public phone number required.",
  },
  {
    icon: Zap,
    title: "Alerts that matter",
    body: "Parking nudges and time-sensitive messages without exposing your identity.",
  },
  {
    icon: Leaf,
    title: "Built to last",
    body: "Outdoor-ready materials engineered for heat, rain, and daily wear.",
  },
  {
    icon: Crown,
    title: "No subscription",
    body: "Pay once for the sticker; the companion app stays free for core safety.",
  },
];

const deliveryChecks = [
  "Dispatched within 24 hours on business days",
  "Tamper-evident protective sleeve",
  "Pan-India courier partners",
  "Order tracking on your phone",
];

function ProductCard({ product, reduceMotion }: { product: ShopProduct; reduceMotion: boolean }) {
  const [tierId, setTierId] = useState(product.tiers[0]?.id ?? "single");
  const tier = useMemo(
    () => product.tiers.find((t) => t.id === tierId) ?? product.tiers[0],
    [product.tiers, tierId]
  );
  const savePct =
    tier && tier.mrp > tier.price ? Math.round((1 - tier.price / tier.mrp) * 100) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-app-soft",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-8"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full p-4 shadow-inner sm:h-40 sm:w-40",
            product.ringClass
          )}
        >
          <Image
            src={product.image}
            alt={product.imageAlt}
            width={320}
            height={320}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {product.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-border/70 bg-secondary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              {b}
            </span>
          ))}
          {product.highlightBadge ? (
            <span className="rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {product.highlightBadge}
            </span>
          ) : null}
        </div>
      </div>

      <h2 className="font-display relative mt-6 text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {product.title}
      </h2>
      <p className="relative mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        {product.description}
      </p>

      <div className="relative mt-5">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Choose pack
        </p>
        <div
          className="mt-2 flex gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1"
          role="group"
          aria-label={`Quantity tiers for ${product.title}`}
        >
          {product.tiers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierId(t.id)}
              className={cn(
                "min-h-10 flex-1 rounded-xl px-2 text-[11px] font-semibold uppercase tracking-wide transition-all sm:text-xs",
                tierId === t.id
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_rgba(37,99,235,0.55)]"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="relative mt-5 space-y-2.5 text-left text-[13px] text-muted-foreground">
        {product.bullets.map((line) => (
          <li key={line} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-6 flex flex-wrap items-end justify-center gap-3 border-t border-border/60 pt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="flex items-center text-3xl font-extrabold tabular-nums text-foreground sm:text-[2rem]">
            <IndianRupee className="h-6 w-6 shrink-0 text-primary opacity-90 sm:h-7 sm:w-7" aria-hidden />
            {tier?.price}
          </span>
          {tier && tier.mrp > tier.price ? (
            <span className="text-sm text-muted-foreground line-through">₹{tier.mrp}</span>
          ) : null}
        </div>
        {savePct > 0 ? (
          <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            {savePct}% save
          </span>
        ) : null}
      </div>

      <Button size="lg" className="relative mt-6 w-full rounded-2xl sm:h-12" asChild>
        <Link href="/contact">
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Buy now
        </Link>
      </Button>
    </motion.article>
  );
}

export function ShopPageClient() {
  const reduceMotion = useReducedMotion();

  return (
    <PageFade>
      <main className="relative">
        {/* Hero */}
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
            <div className="theme-dark-only absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/10" />
            <div
              className="theme-dark-only absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_30%,rgba(59,130,246,0.18),transparent_60%)]"
              aria-hidden
            />
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
                  "inline-flex items-center gap-2 rounded-full border border-primary/35",
                  "bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-sm"
                )}
              >
                <Truck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Free shipping on all orders
              </span>

              <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                Your vehicle always reachable
                <br />
                <span className="bg-linear-to-r from-primary via-sky-500 to-primary bg-clip-text text-transparent">
                  {SITE_NAME} QR
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
                Official stickers for bikes and cars — scan-to-chat contact without broadcasting your
                number. Built for Indian roads, sealed against weather, and designed to match our app
                experience.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {heroPerks.map(({ icon: Icon, label }) => (
                  <li key={label} className="inline-flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild className="rounded-full">
                  <Link href="/contact">
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    Buy stickers
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full">
                  <Link href="/how-to-use">How it works</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Products */}
        <section className="bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Official store
              </span>
              <h2 className="font-display mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Pick your{" "}
                <span className="bg-linear-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                  QR edition
                </span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-[15px]">
                Two formats, one privacy-first workflow. Select a pack and complete checkout with our team.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {products.map((p) => (
                <ProductCard key={p.key} product={p} reduceMotion={reduceMotion} />
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="border-t border-border/60 bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {valueProps.map(({ icon: Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-app-soft transition-all duration-200 hover:border-primary/35"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="font-display mt-4 text-base font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery + why buy */}
        <section className="bg-background pb-16 pt-2 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                }
                className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-7 shadow-app-soft sm:p-8"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-primary/12 blur-3xl"
                />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Truck className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                      Fast delivery
                    </h2>
                    <p className="text-sm text-muted-foreground">We ship direct from the official warehouse.</p>
                  </div>
                </div>
                <ul className="relative mt-6 space-y-3 text-sm text-muted-foreground">
                  {deliveryChecks.map((line) => (
                    <li key={line} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                }
                className="flex flex-col justify-center rounded-3xl border border-border/80 bg-card/60 p-7 shadow-app-soft backdrop-blur-sm sm:p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Award className="h-6 w-6" aria-hidden />
                  </span>
                  <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                    Why buy direct?
                  </h2>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  Purchasing from {SITE_NAME} means authentic QR encoding, quality-controlled printing,
                  and support that understands the product. Third-party marketplaces can&apos;t guarantee
                  scan reliability or warranty coverage.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-5 py-4 text-center">
                    <p className="font-display text-2xl font-extrabold tabular-nums text-foreground">
                      10k+
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Active users
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-5 py-4 text-center">
                    <p className="font-display text-2xl font-extrabold tabular-nums text-foreground">
                      4.8/5
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Customer rating
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  <span>Need help choosing a pack? We&apos;re one message away.</span>
                </div>
              </motion.div>
            </div>

            <p className="mt-10 text-center text-xs text-muted-foreground sm:text-sm">
              Prices shown are indicative for demo checkout — confirm with our team on{" "}
              <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                Contact
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </PageFade>
  );
}
