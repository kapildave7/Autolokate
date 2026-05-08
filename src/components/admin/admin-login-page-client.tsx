"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { useAuthStore } from "@/stores/auth-store";

export function AdminLoginPageClient() {
  const router = useRouter();
  const requestOtpCode = useAuthStore((s) => s.requestOtpCode);
  const verifyOtpCode = useAuthStore((s) => s.verifyOtpCode);

  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phone.trim().length < 8) {
      toast.error("Enter a valid phone number with country code.");
      return;
    }
    setSubmitting(true);
    try {
      await requestOtpCode(phone.trim());
      setStep("otp");
      toast.success("OTP sent to your phone.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to send OTP.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyOtp() {
    if (otp.trim().length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    setSubmitting(true);
    try {
      await verifyOtpCode(phone.trim(), otp.trim());
      toast.success("Welcome to admin dashboard.");
      router.replace("/admin/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Failed to verify OTP.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full border-purple-100 bg-white shadow-[0_14px_34px_-18px_rgba(109,40,217,0.35)]">
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-700">Autolokate Admin</p>
          <CardTitle className="text-2xl font-bold text-zinc-900">Secure Sign In</CardTitle>
          <CardDescription className="text-zinc-600">
            Login with OTP to access admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "phone" ? (
            <form className="space-y-4" onSubmit={onSubmitPhone}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-phone">Phone number</Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98XXXXXX12"
                  className="h-11 border-purple-200 focus-visible:ring-purple-300"
                />
              </div>
              <Button type="submit" className="h-11 w-full bg-purple-700 hover:bg-purple-800" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-otp">Enter OTP</Label>
                <Input
                  id="admin-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="h-11 border-purple-200 text-center tracking-[0.3em] focus-visible:ring-purple-300"
                />
                <p className="text-xs text-zinc-500">Code sent to {phone}.</p>
              </div>
              <Button
                type="button"
                className="h-11 w-full bg-purple-700 hover:bg-purple-800"
                onClick={() => void onVerifyOtp()}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify and continue"
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-purple-700" onClick={() => setStep("phone")}>
                Change number
              </Button>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-purple-700" />
            <p className="text-xs text-purple-800">Admin routes require a valid authenticated session.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
