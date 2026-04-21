"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createBooking } from "@/lib/client/booking-api";
import { ApiError } from "@/lib/client/api-client";
import { createPaymentOrder, verifyPayment } from "@/lib/client/payment-api";
import {
  parsePaymentOrderResponse,
  storeConsultReceiptApi,
  type ExpertTimeSlot,
} from "@/lib/expert-booking-normalize";

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

async function ensureRazorpayScript(): Promise<boolean> {
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

function recordFromUnknown(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function bookingIdFromCreateResponse(raw: unknown): string {
  const o = recordFromUnknown(raw) ?? {};
  const nested =
    recordFromUnknown(o.data) ?? recordFromUnknown(o.booking) ?? recordFromUnknown(o.result) ?? o;
  const id = nested.id ?? nested.booking_id ?? o.booking_id;
  return typeof id === "string" ? id : String(id ?? "");
}

function meetLinkFromVerify(raw: unknown): string | null {
  const o = recordFromUnknown(raw) ?? {};
  const nested = recordFromUnknown(o.data) ?? o;
  const link =
    (typeof nested.google_meet_link === "string" && nested.google_meet_link) ||
    (typeof nested.meet_link === "string" && nested.meet_link) ||
    (typeof nested.meeting_url === "string" && nested.meeting_url) ||
    (typeof nested.google_meet_url === "string" && nested.google_meet_url) ||
    null;
  return link;
}

function amountInrFromOrder(parsed: { amountPaise: number }): number {
  return Math.round(parsed.amountPaise / 100);
}

export type ExpertBookingPayInput = {
  name: string;
  phone: string;
  slot: ExpertTimeSlot;
  /** yyyy-MM-dd — must match slot day */
  slotDate: string;
};

async function openRazorpayCheckout(params: {
  orderRaw: unknown;
  name: string;
  phone: string;
  slotDate: string;
  timeLabel: string;
  router: { push: (href: string) => void };
}): Promise<void> {
  const { orderRaw, name, phone, slotDate, timeLabel, router } = params;
  const parsed = parsePaymentOrderResponse(orderRaw);
  const publicKey =
    parsed.keyId ||
    (typeof process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "string"
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      : "");
  if (!parsed.razorpayOrderId || !publicKey || !parsed.amountPaise) {
    toast.error("Could not start payment. Try again in a moment.");
    return;
  }

  const scriptOk = await ensureRazorpayScript();
  if (!scriptOk || !window.Razorpay) {
    toast.error("Could not load Razorpay. Check your connection.");
    return;
  }

  return new Promise<void>((resolve) => {
    const rzp = new window.Razorpay!({
      key: publicKey,
      amount: parsed.amountPaise,
      currency: parsed.currency || "INR",
      name: "Autolokate",
      description: "15-minute expert consultation",
      order_id: parsed.razorpayOrderId,
      prefill: { name: name.trim(), contact: phone.trim() },
      modal: {
        ondismiss: () => resolve(),
      },
      handler: async (response: RazorpayResponse) => {
        try {
          const verified = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          const meetLink = meetLinkFromVerify(verified);
          storeConsultReceiptApi({
            ok: true,
            provider: "razorpay",
            name: name.trim(),
            phone: phone.trim(),
            date: slotDate,
            time: timeLabel,
            amountInr: amountInrFromOrder(parsed),
            currency: parsed.currency || "INR",
            reference: response.razorpay_payment_id,
            customerEmail: null,
            paidAt: new Date().toISOString(),
            meetLink,
          });
          router.push("/checkout/confirmation?type=consult&src=api");
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : "Payment verification failed.";
          toast.error(msg);
        } finally {
          resolve();
        }
      },
    });
    rzp.open();
  });
}

export function useExpertBookingPayment() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const completePaymentForBooking = useCallback(
    async (input: {
      bookingId: string;
      name: string;
      phone: string;
      slotDate: string;
      timeLabel: string;
    }) => {
      setPaying(true);
      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `resume-${input.bookingId}-${Date.now()}`;
        const orderRaw = await createPaymentOrder(input.bookingId, idempotencyKey);
        await openRazorpayCheckout({
          orderRaw,
          name: input.name,
          phone: input.phone,
          slotDate: input.slotDate,
          timeLabel: input.timeLabel,
          router,
        });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Could not resume payment.";
        toast.error(msg);
      } finally {
        setPaying(false);
      }
    },
    [router]
  );

  const pay = useCallback(
    async ({ name, phone, slot, slotDate }: ExpertBookingPayInput) => {
      setPaying(true);
      try {
        const bookingRaw = await createBooking({
          slot_date: slotDate,
          slot_start_time: slot.slotStartTime,
          slot_end_time: slot.slotEndTime,
          booking_type: "founder_call",
        });
        const bookingId = bookingIdFromCreateResponse(bookingRaw);
        if (!bookingId) {
          toast.error("Could not create booking. Please try another slot.");
          return;
        }

        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `idem-${bookingId}-${Date.now()}`;

        const orderRaw = await createPaymentOrder(bookingId, idempotencyKey);
        const timeLabel = slot.label;
        await openRazorpayCheckout({
          orderRaw,
          name: name.trim(),
          phone: phone.trim(),
          slotDate,
          timeLabel,
          router,
        });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
        toast.error(msg);
      } finally {
        setPaying(false);
      }
    },
    [router]
  );

  return { pay, paying, completePaymentForBooking };
}
