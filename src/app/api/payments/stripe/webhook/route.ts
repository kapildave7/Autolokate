import Stripe from "stripe";
import { NextResponse } from "next/server";
import { persistConsultBooking } from "@/lib/server/consult-bookings";
import { createCalendarEvent } from "@/lib/server/google-calendar";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook payload." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.date && session.metadata?.time) {
      const [hh, mm] = String(session.metadata.time).split(":").map((v) => Number(v));
      const start = new Date(`${session.metadata.date}T00:00:00+05:30`);
      start.setHours(Number.isFinite(hh) ? hh : 10, Number.isFinite(mm) ? mm : 30, 0, 0);
      const end = new Date(start.getTime() + 15 * 60 * 1000);

      let calendarEventId: string | null = null;
      try {
        calendarEventId = await createCalendarEvent({
          summary: "Autolokate Consultation Call",
          description: `Name: ${session.metadata.name ?? "NA"}\nPhone: ${session.metadata.phone ?? "NA"}`,
          startIso: start.toISOString(),
          endIso: end.toISOString(),
        });
      } catch {
        calendarEventId = null;
      }

      await persistConsultBooking({
        id: `CB-${Date.now().toString(36).toUpperCase()}`,
        provider: "stripe",
        paymentRef: session.id,
        amountInr: ((session.amount_total ?? 0) / 100),
        name: session.metadata.name ?? "",
        phone: session.metadata.phone ?? "",
        date: session.metadata.date ?? "",
        time: session.metadata.time ?? "",
        status: "paid",
        createdAt: new Date().toISOString(),
        ...(calendarEventId ? { calendarEventId } : {}),
      });
    }
  }

  return NextResponse.json({ received: true });
}

