import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getRazorpayCredentials } from "@/lib/server/razorpay-credentials";
import { AI_ACCESS_MONTHLY_INR } from "@/lib/constants";

export async function POST() {
  try {
    const creds = getRazorpayCredentials();
    if (!creds.ok) {
      return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
    }
    const { keyId, keySecret } = creds;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: AI_ACCESS_MONTHLY_INR * 100,
      currency: "INR",
      receipt: `ai_${Date.now().toString(36)}`.slice(0, 40),
      notes: {
        product: "ai_monthly_access",
      },
    });

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[create-ai-access-razorpay]", error);
    return NextResponse.json(
      { error: "Could not start payment. Try again or use card checkout." },
      { status: 500 }
    );
  }
}
