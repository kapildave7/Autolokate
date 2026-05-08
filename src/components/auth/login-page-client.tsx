"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const LOGO_DARK_SRC = "https://autolokate.com/autolokate_dark.png";
const LOGO_LIGHT_SRC = "https://autolokate.com/autolokate_light.png";
const HERO_VIDEO_SRC = "/videos/ultra-realistic-cinematic-short-film-of-a-young-pr.mp4";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);

  const safeNext = useSafeNext(searchParams);
  const stepParam = searchParams.get("step");
  const phoneParam = searchParams.get("phone");
  const activePhone = (phoneParam || otpPhoneStore || "").trim();
  const isOtpStep = stepParam === "otp" && activePhone.length > 0;

  useEffect(() => {
    if (isOtpStep) {
      otpInputRef.current?.focus();
    }
  }, [isOtpStep]);

  useEffect(() => {
    if (stepParam === "otp" && !activePhone) {
      router.replace(safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login");
    }
  }, [stepParam, activePhone, router, safeNext]);

  const showVideo = !reduceMotion && !videoLoadError;

  useEffect(() => {
    if (!showVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.defaultMuted = true;
    el.muted = true;
    const kick = () => {
      void el.play().catch(() => {});
    };
    kick();
    const onVis = () => {
      if (document.visibilityState === "visible") kick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [showVideo]);

  function kickVideoPlayback() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => {});
  }

  async function onSubmitPhone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith("+") || normalizedPhone.length < 8) {
      toast.error("Please enter a valid phone number with country code.");
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

  async function handleVerify() {
    if (!activePhone) {
      toast.error("Phone number not found. Enter your number again.");
      router.replace("/login");
      return;
    }
    if (otp.trim().length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setVerifying(true);
    try {
      await verifyOtpCode(activePhone, otp.trim());
      toast.success("Logged in successfully.");
      router.push(safeNext || "/");
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "OTP verification failed.";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!activePhone) {
      toast.error("Phone number not found.");
      return;
    }

    setResending(true);
    try {
      await requestOtpCode(activePhone);
      toast.success("OTP resent.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to resend OTP.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  }

  function handleChangePhone() {
    setOtp("");
    const q = new URLSearchParams();
    if (safeNext) q.set("next", safeNext);
    router.replace(q.toString() ? `/login?${q.toString()}` : "/login");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950">
      {showVideo ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black" aria-hidden>
          <video
            key={HERO_VIDEO_SRC}
            ref={videoRef}
            className="absolute left-1/2 top-1/2 h-full min-h-full w-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.02] object-cover"
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onError={() => setVideoLoadError(true)}
            onLoadedData={kickVideoPlayback}
            onCanPlay={kickVideoPlayback}
          />
        </div>
      ) : null}

      <div
        className="absolute inset-0 z-[1] bg-linear-to-br from-zinc-950/72 via-zinc-950/48 to-zinc-900/68"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="absolute inset-0 z-[3] bg-linear-to-t from-zinc-950 via-transparent to-zinc-950/35" aria-hidden />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-sm font-medium text-white/95 backdrop-blur-md transition hover:bg-black/35 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        Back to home
      </Link>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <div
            className={cn(
              "rounded-[1.75rem] border border-white/12 bg-white/[0.97] p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl",
              "sm:p-10"
            )}
          >
            {!isOtpStep ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="mb-8 inline-flex outline-none ring-offset-2 ring-offset-white transition hover:opacity-90 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <BrandWordmark className="h-8 w-auto sm:h-9" />
                  </Link>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                    Sign in with OTP
                  </h1>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Enter your mobile number. We&apos;ll send a one-time code to verify it&apos;s you — quick and secure.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={onSubmitPhone}>
                  <div className="space-y-2">
                    <Label htmlFor="login-phone" className="text-sm font-medium text-foreground">
                      Phone number
                    </Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="+91 98123 45678"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 rounded-xl border-border/90 bg-background px-4 text-base shadow-inner"
                    />
                    <p className="text-xs text-muted-foreground">Include country code (e.g. +91 for India).</p>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>

                <div className="mt-8 flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-left">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    We never post on your behalf. OTPs expire quickly — same security pattern used across Autolokate.
                  </p>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link href="/auth/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <Link
                    href="/"
                    className="mb-6 inline-flex outline-none ring-offset-2 ring-offset-white transition hover:opacity-90 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <BrandWordmark className="h-8 w-auto sm:h-9" />
                  </Link>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Autolokate</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">Secure access</p>
                  <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                    Verify OTP
                  </h1>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Enter the 6-digit code sent to {activePhone}.
                  </p>
                </div>

                <div className="mt-8 space-y-2">
                  <Label htmlFor="login-otp" className="sr-only">
                    One-time password
                  </Label>
                  <Input
                    ref={otpInputRef}
                    id="login-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    className="h-12 rounded-xl border-border/90 bg-background px-4 text-center text-lg tracking-[0.35em] shadow-inner"
                  />
                  <p className="text-center text-xs text-muted-foreground">Use the OTP received on SMS to continue.</p>
                </div>

                <Button
                  type="button"
                  className="mt-8 h-12 w-full rounded-xl text-base font-semibold shadow-md"
                  size="lg"
                  disabled={verifying}
                  onClick={() => void handleVerify()}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & continue"
                  )}
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Didn&apos;t receive?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => void handleResendOtp()}
                    disabled={resending}
                  >
                    {resending ? "Resending…" : "Resend code"}
                  </button>
                </p>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Wrong number?{" "}
                  <button type="button" className="font-semibold text-primary hover:underline" onClick={handleChangePhone}>
                    Change phone
                  </button>
                </p>
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
