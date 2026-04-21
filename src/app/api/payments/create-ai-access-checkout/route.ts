import { NextResponse } from "next/server";
import Stripe from "stripe";
import { AI_ACCESS_MONTHLY_INR } from "@/lib/constants";

type Payload = {
  returnUrl?: string;
};

const MAX_RETURN = 450;

export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (!secret || !siteUrl) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL." },
        { status: 400 }
      );
    }
    const payload = (await request.json()) as Payload;
    let returnUrl = typeof payload.returnUrl === "string" ? payload.returnUrl.trim() : "";
    if (!returnUrl.startsWith("http://") && !returnUrl.startsWith("https://")) {
      returnUrl = `${siteUrl}${returnUrl.startsWith("/") ? "" : "/"}${returnUrl || "/"}`;
    }
    if (returnUrl.length > MAX_RETURN) {
      returnUrl = returnUrl.slice(0, MAX_RETURN);
    }

    const stripe = new Stripe(secret);
    const amount = AI_ACCESS_MONTHLY_INR;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            unit_amount: amount * 100,
            product_data: {
              name: "Autolokate AI — 30-day access",
              description: "Unlimited listing-aware AI answers on Autolokate for 30 days",
            },
          },
        },
      ],
      metadata: {
        kind: "ai_monthly_access",
        return_url: returnUrl,
      },
      success_url: `${siteUrl}/ai-access/activate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
