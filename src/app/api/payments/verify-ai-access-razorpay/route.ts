import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getRazorpayCredentials } from "@/lib/server/razorpay-credentials";
import { AI_ACCESS_PERIOD_DAYS } from "@/lib/constants";

type Payload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function expiresFromNowIso(): string {
  return new Date(Date.now() + AI_ACCESS_PERIOD_DAYS * 86400000).toISOString();
}

export async function POST(request: Request) {
  const creds = getRazorpayCredentials();
  if (!creds.ok) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
  }
  const { keySecret } = creds;
  const payload = (await request.json()) as Payload;
  const orderId = payload.razorpay_order_id ?? "";
  const paymentId = payload.razorpay_payment_id ?? "";
  const signature = payload.razorpay_signature ?? "";
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true as const,
    expiresAt: expiresFromNowIso(),
    paymentRef: paymentId,
  });
}
