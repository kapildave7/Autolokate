import { NextResponse } from "next/server";
import Stripe from "stripe";

type Payload = {
  kind?: "consult";
  amountInr?: number;
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
};

export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!secret || !siteUrl) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL." },
        { status: 400 }
      );
    }
    const payload = (await request.json()) as Payload;
    if (payload.kind !== "consult") {
      return NextResponse.json({ error: "Unsupported checkout type." }, { status: 400 });
    }
    const stripe = new Stripe(secret);
    const amount = Number(payload.amountInr ?? 400);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

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
              name: "Autolokate Expert Consultation",
              description: "15-minute car buying consultation with manager",
            },
          },
        },
      ],
      metadata: {
        name: payload.name ?? "",
        phone: payload.phone ?? "",
        date: payload.date ?? "",
        time: payload.time ?? "",
      },
      success_url: `${siteUrl}/checkout/confirmation?type=consult&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?type=consult`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create session." }, { status: 500 });
  }
}

