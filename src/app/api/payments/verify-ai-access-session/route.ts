import { NextResponse } from "next/server";
import Stripe from "stripe";
import { AI_ACCESS_PERIOD_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed." }, { status: 400 });
    }
    if (session.metadata?.kind !== "ai_monthly_access") {
      return NextResponse.json({ error: "Invalid product session." }, { status: 400 });
    }

    const paidAtSec = session.created;
    const paidAtMs = typeof paidAtSec === "number" ? paidAtSec * 1000 : Date.now();
    const expiresAt = new Date(paidAtMs + AI_ACCESS_PERIOD_DAYS * 86400000).toISOString();
    const returnUrl = session.metadata.return_url?.trim() || "/";

    return NextResponse.json({
      ok: true as const,
      expiresAt,
      returnUrl,
      paymentRef: sessionId,
    });
  } catch {
    return NextResponse.json({ error: "Could not verify session." }, { status: 404 });
  }
}
