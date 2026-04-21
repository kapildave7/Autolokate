import { NextResponse } from "next/server";
import Stripe from "stripe";
import { findConsultBookingByPaymentRef, type ConsultBooking } from "@/lib/server/consult-bookings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim();
  const paymentRef = searchParams.get("payment_ref")?.trim() ?? searchParams.get("orderId")?.trim();

  const ref = sessionId || paymentRef;
  if (!ref) {
    return NextResponse.json({ error: "Missing session_id or payment reference." }, { status: 400 });
  }

  if (ref.startsWith("cs_")) {
    const booking = await findConsultBookingByPaymentRef(ref);
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      if (booking) {
        return NextResponse.json(receiptFromStoredBooking(booking));
      }
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const stripe = new Stripe(secret);
    try {
      const session = await stripe.checkout.sessions.retrieve(ref);
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "This checkout session is not paid." }, { status: 400 });
      }
      const md = session.metadata ?? {};
      const amountInr = (session.amount_total ?? 0) / 100;
      return NextResponse.json({
        ok: true as const,
        provider: "stripe" as const,
        name: String(md.name ?? booking?.name ?? session.customer_details?.name ?? ""),
        phone: String(md.phone ?? booking?.phone ?? ""),
        date: String(md.date ?? booking?.date ?? ""),
        time: String(md.time ?? booking?.time ?? ""),
        amountInr: amountInr > 0 ? amountInr : (booking?.amountInr ?? 400),
        currency: (session.currency ?? "inr").toUpperCase(),
        reference: ref,
        customerEmail: session.customer_details?.email ?? null,
        paidAt: booking?.createdAt ?? new Date(session.created * 1000).toISOString(),
      });
    } catch {
      if (booking) {
        return NextResponse.json(receiptFromStoredBooking(booking));
      }
      return NextResponse.json({ error: "Could not verify this session with Stripe." }, { status: 404 });
    }
  }

  if (ref.startsWith("pay_")) {
    const booking = await findConsultBookingByPaymentRef(ref);
    if (!booking) {
      return NextResponse.json({ error: "Receipt not found. It may take a moment after payment." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true as const,
      provider: "razorpay" as const,
      name: booking.name,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      amountInr: booking.amountInr,
      currency: "INR",
      reference: booking.paymentRef,
      customerEmail: null as string | null,
      paidAt: booking.createdAt,
    });
  }

  return NextResponse.json({ error: "Unsupported payment reference." }, { status: 400 });
}

function receiptFromStoredBooking(booking: ConsultBooking) {
  return {
    ok: true as const,
    provider: booking.provider,
    name: booking.name,
    phone: booking.phone,
    date: booking.date,
    time: booking.time,
    amountInr: booking.amountInr,
    currency: "INR",
    reference: booking.paymentRef,
    customerEmail: null as string | null,
    paidAt: booking.createdAt,
  };
}
