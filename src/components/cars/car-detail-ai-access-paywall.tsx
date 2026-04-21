"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CreditCard, Sparkles, Wallet } from "lucide-react";
import { AI_ACCESS_MONTHLY_INR } from "@/lib/constants";
import { useAiAccessPayment } from "@/hooks/use-ai-access-payment";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";

type Props = {
  onUnlocked: () => void;
  vehicleLabel: string;
};

/** Build return URL for Stripe cancel / metadata; safe to call from click handler (browser only). */
function checkoutReturnUrl(pathname: string | null): string {
  const path =
    pathname && pathname.length > 0
      ? pathname.startsWith("/")
        ? pathname
        : `/${pathname}`
      : "/";
  const { origin, href } = window.location;
  if (origin && origin !== "null") {
    return `${origin}${path}`;
  }
  try {
    return new URL(path, href).href;
  } catch {
    return path;
  }
}

export function CarDetailAiAccessPaywall({ onUnlocked, vehicleLabel }: Props) {
  const pathname = usePathname();
  const [provider, setProvider] = useState<"razorpay" | "stripe">("razorpay");
  const { pay, paying } = useAiAccessPayment(onUnlocked);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-1 sm:px-6 sm:py-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-zinc-600/35 shadow-2xl sm:rounded-[2.35rem]",
          "scheme-dark text-white",
          "bg-linear-to-br from-zinc-950/98 via-zinc-900/96 to-zinc-950/98",
          "[box-shadow:0_0_0_1px_rgba(255,255,255,0.06),0_4px_24px_-8px_rgba(0,0,0,0.45),0_32px_64px_-28px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.07)]"
        )}
      >
        <div
          className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-zinc-600/22 blur-[110px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-zinc-800/35 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(100%,28rem)] -translate-x-1/2 bg-linear-to-r from-transparent via-zinc-500/45 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,transparent_28%,transparent_72%,rgba(39,39,42,0.35)_100%)]"
          aria-hidden
        />

        <div className="relative grid gap-7 p-6 sm:gap-9 sm:p-9 lg:grid-cols-[1fr_minmax(17rem,21rem)] lg:items-center lg:gap-10 xl:gap-12">
          <div className="min-w-0 space-y-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-[1.125rem] sm:h-14 sm:w-14 sm:rounded-2xl">
                <span
                  className="absolute inset-0 rounded-[1.125rem] bg-linear-to-br from-zinc-600/45 via-zinc-500/25 to-transparent opacity-90 blur-md sm:rounded-2xl"
                  aria-hidden
                />
                <span
                  className="relative flex h-full w-full items-center justify-center rounded-[1.125rem] bg-white/10 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-zinc-400/30 sm:rounded-2xl"
                >
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden strokeWidth={1.75} />
                </span>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                  Autolokate AI
                </p>
                <h2
                  id="car-ai-assistant-heading"
                  className="font-display mt-2.5 text-xl font-semibold tracking-[-0.025em] text-white [text-shadow:0_1px_24px_rgba(0,0,0,0.35)] sm:text-[1.5rem] sm:leading-snug"
                >
                  Clarity for your {vehicleLabel} decision
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-[0.9375rem]">
                  Answers grounded in this listing—pricing context, specs, and ownership cues—in a calm, skimmable
                  layout. Thirty days on this device, every listing you open while you compare.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-2.5 border-t border-white/10 pt-6 sm:flex sm:flex-wrap sm:gap-3 sm:border-0 sm:pt-0">
              {(
                [
                  ["Duration", "30 days"],
                  ["Scope", "All listings"],
                  ["Device", "This browser"],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.1] bg-white/[0.06] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:min-w-[5.5rem] sm:flex-1 sm:rounded-[1.125rem] sm:px-3 sm:py-3.5"
                >
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
                  <dd className="mt-1 text-xs font-medium text-white sm:text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col justify-center gap-5 rounded-[1.75rem] border border-white/[0.12] bg-white/[0.05] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:rounded-[2rem] sm:p-7">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">This pass</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-display text-[2.125rem] font-bold tabular-nums tracking-tight text-white sm:text-[2.35rem]">
                  ₹{AI_ACCESS_MONTHLY_INR}
                </p>
                <span className="text-sm font-medium text-zinc-400">· 30 days</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Secure checkout · unlocks the moment payment completes
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Pay with</p>
              <div className="flex gap-2 rounded-2xl border border-white/10 bg-zinc-950/55 p-1 ring-1 ring-zinc-600/25 sm:rounded-[1.125rem]">
                <button
                  type="button"
                  onClick={() => {
                    setProvider("razorpay");
                    trackEvent("ai_access_pay_provider_select", {
                      event_category: GA_CATEGORIES.conversion,
                      provider: "razorpay",
                      vehicle_label: vehicleLabel,
                    });
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200",
                    provider === "razorpay"
                      ? "bg-linear-to-br from-zinc-700 to-zinc-800 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45)] ring-1 ring-white/15"
                      : "text-zinc-400 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Wallet className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  UPI / Razorpay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvider("stripe");
                    trackEvent("ai_access_pay_provider_select", {
                      event_category: GA_CATEGORIES.conversion,
                      provider: "stripe",
                      vehicle_label: vehicleLabel,
                    });
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200",
                    provider === "stripe"
                      ? "bg-linear-to-br from-zinc-700 to-zinc-800 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45)] ring-1 ring-white/15"
                      : "text-zinc-400 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  Card
                </button>
              </div>
            </div>

            <Button
              type="button"
              className="h-11 w-full rounded-2xl border border-white/15 bg-linear-to-r from-zinc-700 via-zinc-600 to-zinc-700 text-sm font-semibold text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)] transition-[box-shadow,transform,filter] hover:brightness-110 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] active:scale-[0.99] disabled:opacity-55 disabled:hover:brightness-100 sm:h-12 sm:rounded-[1.125rem]"
              disabled={paying}
              onClick={() => {
                trackEvent("ai_access_checkout_start", {
                  event_category: GA_CATEGORIES.conversion,
                  provider,
                  vehicle_label: vehicleLabel,
                });
                void pay(provider, checkoutReturnUrl(pathname));
              }}
            >
              {paying ? "Opening secure checkout…" : `Continue — ₹${AI_ACCESS_MONTHLY_INR}`}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-zinc-500 sm:text-left">
              Research use only—confirm price and availability with an authorised seller. Access stays on this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
