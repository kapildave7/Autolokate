import { NextRequest, NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";
import { getCarById } from "@/data";
import { coerceClientCarForAi } from "@/lib/ai/coerce-client-car-for-chat";
import type { Car } from "@/data/types";

export const maxDuration = 60;

type ChatTurn = { role: "user" | "assistant"; content: string };

function buildListingContext(car: Car) {
  const specEntries = Object.entries(car.specs).slice(0, 24);
  const fromCatalogueApi = car.companyId === "catalogue";
  return {
    dataSource: fromCatalogueApi ? "catalogue_api" : "demo_listing",
    brand: car.brand,
    model: car.model,
    variant: car.variant,
    year: car.year,
    listedExShowroomApprox: car.price,
    listPrice: car.listPrice,
    city: car.city,
    fuel: car.fuel,
    transmission: car.transmission,
    bodyType: car.bodyType,
    mileageAsListed: car.mileage,
    odometerKm: car.kms,
    owners: car.owners,
    engine: car.engine,
    power: car.power,
    torque: car.torque,
    exteriorColor: car.exteriorColor,
    sellerType: car.sellerType,
    certified: car.certified,
    isNew: car.isNew,
    keyFeatures: car.features.slice(0, 20),
    specs: Object.fromEntries(specEntries),
    pros: car.pros.slice(0, 8),
    cons: car.cons.slice(0, 8),
  };
}

/** User-safe copy for Autolokate AI; operators fix quota/billing at platform.openai.com */
function userFacingProviderError(err: APIError, isDev: boolean) {
  const code = err.code ?? "";
  const msg = err.message ?? "";

  if (err.status === 429 && (code === "insufficient_quota" || /quota|billing/i.test(msg))) {
    return {
      status: 503 as const,
      error:
        "Autolokate AI is paused right now — the AI backend hit a usage limit or needs billing. If you run this site, add credits or a payment method at platform.openai.com, then try again.",
      dev: isDev
        ? { aiStatus: err.status, aiCode: code, aiType: err.type, detail: msg }
        : undefined,
    };
  }

  if (err.status === 429) {
    return {
      status: 429 as const,
      error: "Autolokate AI is busy. Please wait a moment and try again.",
      dev: isDev
        ? { aiStatus: err.status, aiCode: code, aiType: err.type, detail: msg }
        : undefined,
    };
  }

  if (err.status === 401) {
    return {
      status: 503 as const,
      error: isDev
        ? msg
        : "Autolokate AI is not configured correctly on this server.",
      dev: isDev
        ? { aiStatus: err.status, aiCode: code, aiType: err.type, detail: msg }
        : undefined,
    };
  }

  return {
    status:
      err.status === 403
        ? (503 as const)
        : err.status && err.status >= 400 && err.status < 600
          ? (err.status as 400 | 401 | 403 | 404 | 429 | 500 | 502 | 503)
          : (502 as const),
    error: isDev ? msg : "Could not reach Autolokate AI. Try again shortly.",
    dev: isDev
      ? { aiStatus: err.status, aiCode: code, aiType: err.type, detail: msg }
      : undefined,
  };
}

function systemPrompt(context: ReturnType<typeof buildListingContext>): string {
  const catalogueNote =
    context.dataSource === "catalogue_api"
      ? "\n- Context is from the **Autolokate new-car catalogue** (model/variant snapshot). It is not a dealer quote or used listing unless stated."
      : "\n- Context is from a **sample listing record** in Autolokate demo data when applicable.";
  return `You are Autolokate AI helping users research vehicles in India. Answer in clear English for the Indian market (₹, cities, ownership patterns).

PAGE CONTEXT (ground truth for this chat — not a live dealer quote):
${JSON.stringify(context, null, 2)}
${catalogueNote}

Rules:
- The user is asking about **${context.brand} ${context.model}** (variant: ${context.variant}, ${context.year}). Stay specific to this trim when relevant.
- For on-road price, waiting periods, exact bills, delivery: give sensible ranges and **always** say figures vary by city${context.city && context.city !== "India" ? ` (reference: ${context.city})` : ""}, dealer, taxes, and date — user must confirm with an **authorised dealer in India**.
- Do not invent exact prices or delivery dates. If unsure, say so.
- Be concise; bullets when helpful.
- You do not sell cars or take bookings; informational only.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Autolokate AI is not configured. Set OPENAI_API_KEY on the server (see .env.example)." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as { carId?: string; messages?: ChatTurn[]; car?: unknown };
  const carId = typeof b.carId === "string" ? b.carId.trim() : "";
  const messages = Array.isArray(b.messages) ? b.messages : [];

  if (!carId) {
    return NextResponse.json({ error: "carId is required" }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages must not be empty" }, { status: 400 });
  }

  let car: Car | undefined = getCarById(carId);
  if (!car) {
    car = coerceClientCarForAi(carId, b.car) ?? undefined;
  }
  if (!car) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return NextResponse.json({ error: "Invalid message role" }, { status: 400 });
    }
    if (typeof m.content !== "string" || m.content.length > 8000) {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  const trimmed = messages.slice(-24);
  const context = buildListingContext(car);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt(context) },
        ...trimmed.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1600,
      temperature: 0.65,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Autolokate AI returned an empty answer. Try again." }, { status: 502 });
    }

    return NextResponse.json({ message: text });
  } catch (e) {
    const isDev = process.env.NODE_ENV === "development";

    if (e instanceof APIError) {
      const err = e;
      console.error("[ai-chat] Autolokate AI provider error", err.status, err.code, err.message, err.type);
      const mapped = userFacingProviderError(err, isDev);
      return NextResponse.json(
        {
          error: mapped.error,
          ...(mapped.dev ?? {}),
        },
        { status: mapped.status }
      );
    }

    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai-chat]", e);
    return NextResponse.json(
      {
        error: isDev ? msg : "Could not reach Autolokate AI. Try again shortly.",
      },
      { status: 502 }
    );
  }
}
