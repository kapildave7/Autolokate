"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { flagAiAccessWelcomeAfterPurchase, writeAiAccess } from "@/lib/client/ai-access-storage";

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

export function useAiAccessPayment(onPaid: () => void) {
  const [paying, setPaying] = useState(false);

  const pay = useCallback(
    async (provider: "stripe" | "razorpay", returnUrl: string) => {
      setPaying(true);
      let leaveSpinnerUntilDismiss = false;
      try {
        if (provider === "stripe") {
          const response = await fetch("/api/payments/create-ai-access-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ returnUrl }),
          });
          const payload = (await response.json()) as { url?: string; error?: string };
          if (!response.ok || !payload.url) {
            toast.error(payload.error || "Could not start card checkout. Try Razorpay or try again.");
            return;
          }
          window.location.href = payload.url;
          return;
        }

        const scriptOk = await ensureRazorpayScript();
        if (!scriptOk || !window.Razorpay) {
          toast.error("Could not load Razorpay. Try Stripe or check your connection.");
          return;
        }

        const orderRes = await fetch("/api/payments/create-ai-access-razorpay", { method: "POST" });
        const orderPayload = (await orderRes.json()) as {
          keyId?: string;
          orderId?: string;
          amount?: number;
          currency?: string;
          error?: string;
        };
        if (!orderRes.ok || !orderPayload.keyId || !orderPayload.orderId || !orderPayload.amount || !orderPayload.currency) {
          toast.error(orderPayload.error || "Could not open UPI checkout. Try Stripe.");
          return;
        }

        leaveSpinnerUntilDismiss = true;
        const rzp = new window.Razorpay({
          key: orderPayload.keyId,
          amount: orderPayload.amount,
          currency: orderPayload.currency,
          name: "Autolokate",
          description: "Autolokate AI — 30-day access",
          order_id: orderPayload.orderId,
          modal: {
            ondismiss: () => setPaying(false),
          },
          handler: async (response: RazorpayResponse) => {
            setPaying(false);
            const verifyRes = await fetch("/api/payments/verify-ai-access-razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const body = (await verifyRes.json()) as { ok?: boolean; expiresAt?: string; paymentRef?: string; error?: string };
            if (!verifyRes.ok || !body.ok || !body.expiresAt || !body.paymentRef) {
              toast.error(body.error || "Payment could not be verified.");
              return;
            }
            writeAiAccess({
              expiresAt: body.expiresAt,
              provider: "razorpay",
              paymentRef: body.paymentRef,
            });
            flagAiAccessWelcomeAfterPurchase();
            toast.success("Welcome to Autolokate AI — your access is active for 30 days.");
            onPaid();
          },
        });
        rzp.open();
      } finally {
        if (!leaveSpinnerUntilDismiss) setPaying(false);
      }
    },
    [onPaid]
  );

  return { pay, paying };
}
