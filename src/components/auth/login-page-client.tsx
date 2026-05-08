"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type CSSProperties, type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const LOGO_DARK_SRC = "https://autolokate.com/autolokate_dark.png";
const LOGO_LIGHT_SRC = "https://autolokate.com/autolokate_light.png";
const LOGIN_BG_DARK = "/images/login_bg_dark.png";
const LOGIN_BG_LIGHT = "/images/login_bg_light.png";

// `theme-dark-only` / `theme-light-only` set `display: var(--theme-dark-display, inline-block)`
// in globals.css, which would otherwise override Tailwind's `flex` / `inline-flex`. These inline
// styles set the variable per-element so the active theme renders with the correct flex display.
const INLINE_FLEX_THEME_VAR = { "--theme-dark-display": "inline-flex" } as CSSProperties;
const FLEX_THEME_VAR = { "--theme-dark-display": "flex" } as CSSProperties;

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 6;
const OTP_CELLS = Array.from({ length: OTP_LENGTH }, (_, i) => i);

/** Human-readable phone — "+918888888888" → "+91 88888 88888". Falls back to input as-is. */
function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (/^\+91\d{10}$/.test(trimmed)) {
    const local = trimmed.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return trimmed;
}

function BrandWordmark({ className }: { className?: string }) {
  return (
    <>
      <Image
        src={LOGO_DARK_SRC}
        alt="Autolokate"
        width={140}
        height={36}
        priority
        className={cn("theme-dark-only", className)}
      />
      <Image
        src={LOGO_LIGHT_SRC}
        alt="Autolokate"
        width={140}
        height={36}
        priority
        className={cn("theme-light-only", className)}
      />
    </>
  );
}

function useSafeNext(searchParams: ReturnType<typeof useSearchParams>) {
  const raw = searchParams.get("next")?.trim() ?? "";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "";
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestOtpCode = useAuthStore((s) => s.requestOtpCode);
  const verifyOtpCode = useAuthStore((s) => s.verifyOtpCode);
  const otpPhoneStore = useAuthStore((s) => s.otpPhone);

  const reduceMotion = useReducedMotion();
  const otpInputRef = useRef<HTMLInputElement>(null);

  const [localDigits, setLocalDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const safeNext = useSafeNext(searchParams);
  const stepParam = searchParams.get("step");
  const phoneParam = searchParams.get("phone");
  const activePhone = (phoneParam || otpPhoneStore || "").trim();
  const isOtpStep = stepParam === "otp" && activePhone.length > 0;

  useEffect(() => {
    if (isOtpStep) {
      otpInputRef.current?.focus();
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [isOtpStep]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (stepParam === "otp" && !activePhone) {
      router.replace(safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login");
    }
  }, [stepParam, activePhone, router, safeNext]);

  async function onSubmitPhone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = localDigits.replace(/\D/g, "").replace(/^0+/, "");
    const normalizedPhone = `+91${digits}`;
    if (digits.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await requestOtpCode(normalizedPhone);
      if (response.sent) {
        toast.success(response.message || "OTP sent successfully.");
        const q = new URLSearchParams();
        q.set("step", "otp");
        q.set("phone", normalizedPhone);
        if (safeNext) q.set("next", safeNext);
        router.replace(`/login?${q.toString()}`);
      } else {
        toast.error("Unable to send OTP. Please try again.");
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to send OTP right now.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(code: string) {
    if (!activePhone) {
      toast.error("Phone number not found. Enter your number again.");
      router.replace("/login");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setVerifying(true);
    try {
      await verifyOtpCode(activePhone, code);
      toast.success("Logged in successfully.");
      router.push(safeNext || "/");
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "OTP verification failed.";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerify() {
    return verifyCode(otp.trim());
  }

  async function handleResendOtp() {
    if (!activePhone) {
      toast.error("Phone number not found.");
      return;
    }
    if (resendCooldown > 0) return;

    setResending(true);
    try {
      await requestOtpCode(activePhone);
      toast.success("OTP resent.");
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      otpInputRef.current?.focus();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to resend OTP.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  }

  function handleChangePhone() {
    setOtp("");
    setLocalDigits("");
    const q = new URLSearchParams();
    if (safeNext) q.set("next", safeNext);
    router.replace(q.toString() ? `/login?${q.toString()}` : "/login");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 bg-zinc-950 theme-dark-only" aria-hidden />
      <div className="theme-light-only pointer-events-none absolute inset-0 z-0 bg-zinc-100" aria-hidden />

      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src={LOGIN_BG_DARK}
          alt=""
          fill
          priority
          sizes="100vw"
          className="theme-dark-only object-cover object-[82%_center]"
        />
        <Image
          src={LOGIN_BG_LIGHT}
          alt=""
          fill
          priority
          sizes="100vw"
          className="theme-light-only object-cover object-[78%_center]"
        />
      </div>

      <div
        className="theme-dark-only pointer-events-none absolute inset-0 z-[1] bg-linear-to-br from-black/58 via-zinc-950/38 to-black/50"
        aria-hidden
      />
      <div
        className="theme-dark-only pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_100%_75%_at_28%_18%,rgba(59,130,246,0.14),transparent_52%)]"
        aria-hidden
      />
      <div
        className="theme-light-only pointer-events-none absolute inset-0 z-[1] bg-linear-to-br from-white/72 via-sky-50/35 to-white/62"
        aria-hidden
      />
      <div
        className="theme-light-only pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_90%_65%_at_22%_22%,rgba(255,255,255,0.55),transparent_55%)]"
        aria-hidden
      />

      <Link
        href="/"
        aria-label="Back to home"
        style={INLINE_FLEX_THEME_VAR}
        className="theme-dark-only absolute left-4 top-4 z-20 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-white/12 bg-black/30 px-3.5 text-sm font-medium text-white/95 shadow-sm backdrop-blur-md transition hover:bg-black/40 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-4 shrink-0 opacity-90" aria-hidden />
        <span className="leading-none">Back to home</span>
      </Link>
      <Link
        href="/"
        aria-label="Back to home"
        style={INLINE_FLEX_THEME_VAR}
        className="theme-light-only absolute left-4 top-4 z-20 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-foreground shadow-md transition hover:bg-zinc-50 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-4 shrink-0 opacity-90" aria-hidden />
        <span className="leading-none">Back to home</span>
      </Link>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <div className="login-auth-card text-card-foreground">
            {!isOtpStep ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="mb-8 inline-flex outline-none ring-offset-2 ring-offset-transparent transition hover:opacity-90 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <BrandWordmark className="h-8 w-auto sm:h-9" />
                  </Link>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                    Sign in with OTP
                  </h1>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Enter your mobile number and we&apos;ll send a one-time code to verify it&apos;s you — fast and
                    secure.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={onSubmitPhone}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="login-phone" className="text-sm font-medium text-foreground">
                      Phone number
                    </Label>
                    <div className="group flex h-12 w-full items-center overflow-hidden rounded-xl border border-border/80 bg-background shadow-inner transition-[color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                      <div
                        className="flex h-full shrink-0 items-center gap-1.5 border-r border-border/70 bg-muted/40 px-3 text-sm font-medium text-foreground"
                        aria-hidden
                      >
                        <span className="text-[1rem] leading-none">🇮🇳</span>
                        <span className="leading-none">+91</span>
                        <ChevronDown
                          className="size-3.5 shrink-0 text-muted-foreground"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      </div>
                      <Input
                        id="login-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="Enter mobile number"
                        autoComplete="tel-national"
                        value={localDigits}
                        onChange={(e) => setLocalDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="h-full flex-1 rounded-none border-0 bg-transparent px-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Include country code (e.g. +91 for India).</p>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-md [&_svg]:size-4"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden />
                        <span>Sending code…</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight aria-hidden />
                      </>
                    )}
                  </Button>
                </form>

                {/* <div
                  style={FLEX_THEME_VAR}
                  className="theme-dark-only mt-8 flex items-start gap-2.5 rounded-xl border border-white/12 bg-black/22 px-3 py-2.5 text-left backdrop-blur-sm"
                >
                  <ShieldCheck className="mt-[1px] size-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-[11px] leading-snug text-zinc-300">
                    We never post on your behalf. OTPs expire quickly — same security pattern used across Autolokate.
                  </p>
                </div>
                <div
                  style={FLEX_THEME_VAR}
                  className="theme-light-only mt-8 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2.5 text-left"
                >
                  <ShieldCheck className="mt-[1px] size-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    We never post on your behalf. OTPs expire quickly — same security pattern used across Autolokate.
                  </p>
                </div> */}

                <div className="relative -mx-8 mt-9 sm:-mx-10">
                  <div className="w-full border-t border-border/55" />
                  <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card px-1.5 py-0.5 shadow-sm">
                    <ShieldCheck className="size-3 text-primary" aria-hidden />
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="mb-7 inline-flex outline-none ring-offset-2 ring-offset-transparent transition hover:opacity-90 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <BrandWordmark className="h-8 w-auto sm:h-9" />
                  </Link>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                    Verify OTP
                  </h1>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-foreground">{formatPhoneDisplay(activePhone)}</span>.
                  </p>
                </div>

                <form
                  className="mt-8"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleVerify();
                  }}
                >
                  <Label htmlFor="login-otp" className="sr-only">
                    One-time password
                  </Label>
                  <div className="relative">
                    <Input
                      ref={otpInputRef}
                      id="login-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
                        setOtp(next);
                        if (next.length === OTP_LENGTH && !verifying) {
                          void verifyCode(next);
                        }
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      aria-label="One-time password"
                      className="peer absolute inset-0 z-10 h-full w-full rounded-xl border-0 bg-transparent p-0 text-center text-transparent caret-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 selection:bg-transparent"
                    />
                    <div className="pointer-events-none grid grid-cols-6 gap-2 sm:gap-2.5">
                      {OTP_CELLS.map((i) => {
                        const digit = otp[i];
                        const isFilled = otp.length > i;
                        const isActive = otp.length === i;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex h-12 items-center justify-center rounded-xl border bg-background text-lg font-semibold tabular-nums shadow-inner transition-colors sm:h-14 sm:text-xl",
                              isActive
                                ? "border-border/80 peer-focus:border-primary peer-focus:ring-2 peer-focus:ring-primary/30"
                                : isFilled
                                  ? "border-primary/40 text-foreground"
                                  : "border-border/80 text-muted-foreground"
                            )}
                          >
                            {digit ?? ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Use the OTP received on SMS to continue.
                  </p>

                  <Button
                    type="submit"
                    className="mt-7 h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-md [&_svg]:size-4"
                    size="lg"
                    disabled={verifying || otp.length !== OTP_LENGTH}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <span>Verify &amp; continue</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="font-semibold text-primary transition hover:underline disabled:pointer-events-none disabled:text-muted-foreground"
                    onClick={() => void handleResendOtp()}
                    disabled={resending || resendCooldown > 0}
                  >
                    {resending
                      ? "Resending…"
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend code"}
                  </button>
                  <span aria-hidden className="h-3 w-px bg-border/70" />
                  <button
                    type="button"
                    className="font-semibold text-primary transition hover:underline"
                    onClick={handleChangePhone}
                  >
                    Change phone
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Loader2 className="h-8 w-8 animate-spin text-white/40" />
    </div>
  );
}

export function LoginPageClient() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginFormInner />
    </Suspense>
  );
}
