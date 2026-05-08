"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useConsultPayment } from "@/hooks/use-consult-payment";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { getCarById } from "@/data";
import { carDetailPath } from "@/lib/seo/paths";
import { TOKEN_AMOUNT_PCT } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageFade } from "@/components/shared/page-fade";
import { GA_CATEGORIES, carEntityParams, trackEvent } from "@/lib/analytics";

export function CheckoutFlow() {
  const sp = useSearchParams();
  const router = useRouter();
  const { pay, paying } = useConsultPayment();
  const type = sp.get("type") === "consult" ? "consult" : "car";
  const carId = sp.get("carId") || "";
  const step = sp.get("step");
  const isToken = step === "token";
  const consultDate = sp.get("date") || "";
  const consultTime = sp.get("time") || "";
  const consultName = sp.get("name") || "";
  const consultPhone = sp.get("phone") || "";

  const car = useMemo(() => getCarById(carId), [carId]);
  const tokenAmount = car ? Math.round((car.price * TOKEN_AMOUNT_PCT) / 100) : 0;

  const [line1, setLine1] = useState("Tower B, 402");
  const [city, setCity] = useState("Mumbai");
  const [pin, setPin] = useState("400001");
  const [provider, setProvider] = useState<"stripe" | "razorpay">("stripe");

  async function submit() {
    if (type === "consult") {
      trackEvent("begin_checkout", {
        event_category: GA_CATEGORIES.checkout,
        checkout_type: "consult",
        payment_provider: provider,
      });
      await pay({
        provider,
        name: consultName,
        phone: consultPhone,
        date: consultDate,
        time: consultTime,
        amountInr: 400,
      });
      return;
    }
    const oid = `AL-${Date.now().toString(36).toUpperCase()}`;
    trackEvent("begin_checkout", {
      event_category: GA_CATEGORIES.checkout,
      checkout_type: isToken ? "car_token" : "car_book",
      payment_provider: provider,
      ...(car ? carEntityParams(car) : {}),
    });
    toast.success(isToken ? "Token payment initiated" : "Booking confirmed");
    router.push(`/checkout/confirmation?orderId=${encodeURIComponent(oid)}&type=${isToken ? "token" : "book"}`);
  }

  if (type === "car" && !car) {
    return (
      <PageFade>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">Pick a car first</p>
          <p className="mt-2 text-sm text-muted-foreground">Open a listing and use Book now or Pay token.</p>
          <Button className="mt-6" asChild>
            <Link href="/compare">Open compare</Link>
          </Button>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground" asChild>
          <Link href={type === "consult" ? "/book-expert" : car ? carDetailPath(car) : "/"}>
            <ArrowLeft className="h-4 w-4" />
            {type === "consult" ? "Back to booking" : car ? "Back to car" : "Back to home"}
          </Link>
        </Button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">{type === "consult" ? "Expert consultation" : isToken ? "Token checkout" : "Reserve vehicle"}</Badge>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {type === "consult"
                ? "Secure your 15-minute manager consultation slot with online payment."
                : "UI-only flow — address, payment method tiles, and confirmation handoff."}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div layout className="space-y-6">
            {type === "car" ? (
              <Card className="border-border bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Delivery / pickup address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="line1">Address line</Label>
                  <Input id="line1" value={line1} onChange={(e) => setLine1(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            ) : (
              <Card className="border-border bg-card/70">
                <CardHeader>
                  <CardTitle>Consultation details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p><strong>Name:</strong> {consultName || "Not provided"}</p>
                  <p><strong>Phone:</strong> {consultPhone || "Not provided"}</p>
                  <p><strong>Date:</strong> {consultDate || "Not selected"}</p>
                  <p><strong>Time:</strong> {consultTime || "Not selected"}</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment options
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(type === "consult" ? ["Stripe", "Razorpay"] : ["UPI", "Card", "Netbanking", "Wallet / BNPL"]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (m === "Stripe") setProvider("stripe");
                      if (m === "Razorpay") setProvider("razorpay");
                    }}
                    className="rounded-xl border border-primary/20 bg-secondary/40 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary/60"
                  >
                    {m}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {type === "consult"
                        ? `Selected: ${provider === "stripe" ? "Stripe" : "Razorpay"}`
                        : "Tap to select"}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <div>
            <Card className="sticky top-24 border-border bg-linear-to-b from-primary/6 via-card to-card">
              <CardHeader>
                <CardTitle className="text-foreground">Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {type === "car" && car ? (
                  <div className="flex gap-3">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                      <RemoteImageWithFallback src={car.images[0]} alt="" fill className="object-cover" sizes="112px" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {car.brand} {car.model}
                      </p>
                      <p className="text-xs text-muted-foreground">{car.variant}</p>
                      <p className="mt-1 text-sm text-primary">{formatINR(car.price)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground">
                    15-minute manager consultation call
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {type === "consult" ? "Consultation fee" : isToken ? "Token (%)" : "Booking hold"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {type === "consult" ? formatINR(400) : isToken ? formatINR(tokenAmount) : formatINR(4999)}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-brand-green-mid/35 bg-brand-green-mid/15 px-3 py-2 text-xs text-brand-green-mid">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {type === "consult"
                    ? "Secure checkout — Razorpay or Stripe."
                    : "Escrow-style messaging — production would tokenize payments."}
                </div>
                <Button className="w-full" size="lg" type="button" onClick={submit} disabled={type === "consult" && paying}>
                  {type === "consult" ? (paying ? "Starting…" : "Pay session fee & confirm") : isToken ? "Pay token amount" : "Confirm booking"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
