import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getRazorpayCredentials } from "@/lib/server/razorpay-credentials";

type Payload = {
  amountInr?: number;
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
};

export async function POST(request: Request) {
  try {
    const creds = getRazorpayCredentials();
    if (!creds.ok) {
      return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
    }
    const { keyId, keySecret } = creds;
    const payload = (await request.json()) as Payload;
    const amountInr = Number(payload.amountInr ?? 400);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountInr * 100,
      currency: "INR",
      receipt: `consult_${Date.now()}`,
      notes: {
        name: payload.name ?? "",
        phone: payload.phone ?? "",
        date: payload.date ?? "",
        time: payload.time ?? "",
      },
    });

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[create-razorpay-order]", error);
    return NextResponse.json(
      { error: "Could not start Razorpay checkout. Try again or use card checkout." },
      { status: 500 }
    );
  }
}

