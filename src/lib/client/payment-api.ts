"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T };
const unbox = <T,>(res: Envelope<T> | T): T =>
  (res && typeof res === "object" && "data" in (res as Envelope<T>) ? ((res as Envelope<T>).data as T) : (res as T));

export async function createPaymentOrder(bookingId: string, idempotencyKey?: string) {
  const res = await apiRequest<Envelope<unknown>>("/v1/payments/orders", {
    method: "POST",
    auth: true,
    body: {
      booking_id: bookingId,
      idempotency_key: idempotencyKey ?? `order-${bookingId}-${Date.now()}`,
    },
  });
  return unbox(res);
}

export async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await apiRequest<Envelope<unknown>>("/v1/payments/verify", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return unbox(res);
}

export async function getPaymentById(paymentId: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/payments/${paymentId}`, { auth: true });
  return unbox(res);
}
