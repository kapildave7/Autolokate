import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ConsultBooking = {
  id: string;
  provider: "stripe" | "razorpay";
  paymentRef: string;
  amountInr: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: "paid";
  createdAt: string;
  calendarEventId?: string;
};

const BOOKINGS_FILE = path.join(process.cwd(), "tmp", "consult-bookings.json");

async function readAll(): Promise<ConsultBooking[]> {
  try {
    const raw = await readFile(BOOKINGS_FILE, "utf8");
    return JSON.parse(raw) as ConsultBooking[];
  } catch {
    return [];
  }
}

async function writeAll(bookings: ConsultBooking[]) {
  await mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
  await writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
}

export async function persistConsultBooking(booking: ConsultBooking) {
  const all = await readAll();
  all.unshift(booking);
  await writeAll(all);
}

export async function findConsultBookingByPaymentRef(paymentRef: string): Promise<ConsultBooking | null> {
  if (!paymentRef) return null;
  const all = await readAll();
  return all.find((b) => b.paymentRef === paymentRef) ?? null;
}

