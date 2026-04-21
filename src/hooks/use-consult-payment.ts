"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function ensureRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type ConsultPaymentInput = {
  provider: "stripe" | "razorpay";
  name: string;
  phone: string;
  date: string;
  time: string;
  amountInr?: number;
};

export function useConsultPayment() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const pay = useCallback(
    async ({ provider, name, phone, date, time, amountInr = 400 }: ConsultPaymentInput) => {
    setPaying(true);
    let leaveSpinnerUntilDismiss = false;
    try {
      if (provider === "stripe") {
        const response = await fetch("/api/payments/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "consult",
            amountInr,
            name: name.trim(),
            phone: phone.trim(),
            date,
            time,
          }),
        });
        const payload = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !payload.url) {
          toast.error(payload.error || "Could not start card checkout. Try again or use another payment option.");
          return;
        }
        window.location.href = payload.url;
        return;
      }

      const scriptOk = await ensureRazorpayScript();
      if (!scriptOk || !window.Razorpay) {
        toast.error("Could not load Razorpay. Check your network or try Stripe.");
        return;
      }
      const orderRes = await fetch("/api/payments/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountInr,
          name: name.trim(),
          phone: phone.trim(),
          date,
          time,
        }),
      });
      const orderPayload = (await orderRes.json()) as {
        keyId?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };
      if (!orderRes.ok || !orderPayload.keyId || !orderPayload.orderId || !orderPayload.amount || !orderPayload.currency) {
        toast.error(orderPayload.error || "Could not open UPI checkout. Try again or use card checkout.");
        return;
      }

      leaveSpinnerUntilDismiss = true;
      const rzp = new window.Razorpay({
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "Autolokate",
        description: "15-minute expert consultation",
        order_id: orderPayload.orderId,
        prefill: { name: name.trim(), contact: phone.trim() },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response: RazorpayResponse) => {
          setPaying(false);
          const verifyRes = await fetch("/api/payments/verify-razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              name: name.trim(),
              phone: phone.trim(),
              date,
              time,
            }),
          });
          if (!verifyRes.ok) {
            const errBody = (await verifyRes.json()) as { error?: string };
            toast.error(errBody.error || "Payment verification failed.");
            return;
          }
          router.push(`/checkout/confirmation?type=consult&orderId=${encodeURIComponent(response.razorpay_payment_id)}`);
        },
      });
      rzp.open();
    } finally {
      if (!leaveSpinnerUntilDismiss) setPaying(false);
    }
    },
    [router]
  );

  return { pay, paying };
}
