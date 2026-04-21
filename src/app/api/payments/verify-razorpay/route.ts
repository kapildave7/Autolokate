import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { persistConsultBooking } from "@/lib/server/consult-bookings";
import { createCalendarEvent } from "@/lib/server/google-calendar";
import { getRazorpayCredentials } from "@/lib/server/razorpay-credentials";

type Payload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
};

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

  const [hh, mm] = String(payload.time ?? "10:30").split(":").map((v) => Number(v));
  const start = new Date(`${payload.date ?? new Date().toISOString().slice(0, 10)}T00:00:00+05:30`);
  start.setHours(Number.isFinite(hh) ? hh : 10, Number.isFinite(mm) ? mm : 30, 0, 0);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  let calendarEventId: string | null = null;
  try {
    calendarEventId = await createCalendarEvent({
      summary: "Autolokate Consultation Call",
      description: `Name: ${payload.name ?? "NA"}\nPhone: ${payload.phone ?? "NA"}`,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    });
  } catch {
    calendarEventId = null;
  }

  await persistConsultBooking({
    id: `CB-${Date.now().toString(36).toUpperCase()}`,
    provider: "razorpay",
    paymentRef: paymentId,
    amountInr: 400,
    name: payload.name ?? "",
    phone: payload.phone ?? "",
    date: payload.date ?? "",
    time: payload.time ?? "",
    status: "paid",
    createdAt: new Date().toISOString(),
    ...(calendarEventId ? { calendarEventId } : {}),
  });

  return NextResponse.json({ ok: true });
}

