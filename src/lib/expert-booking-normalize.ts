import { isValid, parseISO } from "date-fns";

/** Normalized slot for UI + booking payload */
export type ExpertTimeSlot = {
  slotStartTime: string;
  slotEndTime: string;
  label: string;
};

const STORAGE_KEY = "autolokate_consult_receipt_api";

export type StoredConsultReceipt = {
  ok: true;
  provider: "razorpay";
  name: string;
  phone: string;
  date: string;
  time: string;
  amountInr: number;
  currency: string;
  reference: string;
  customerEmail: string | null;
  paidAt: string;
  meetLink?: string | null;
};

export function storeConsultReceiptApi(receipt: StoredConsultReceipt): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(receipt));
  } catch {
    /* ignore */
  }
}

export function readConsultReceiptApi(): StoredConsultReceipt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsultReceipt;
  } catch {
    return null;
  }
}

export function clearConsultReceiptApi(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Pick ISO start/end from various API slot shapes */
function slotFromUnknown(row: unknown): ExpertTimeSlot | null {
  const o = asRecord(row);
  if (!o) return null;
  const start =
    (typeof o.slot_start_time === "string" && o.slot_start_time) ||
    (typeof o.start_time === "string" && o.start_time) ||
    (typeof o.start === "string" && o.start) ||
    "";
  const end =
    (typeof o.slot_end_time === "string" && o.slot_end_time) ||
    (typeof o.end_time === "string" && o.end_time) ||
    (typeof o.end === "string" && o.end) ||
    "";
  if (!start || !end) return null;
  const s = parseISO(start);
  const e = parseISO(end);
  if (!isValid(s) || !isValid(e)) return null;
  const label = formatSlotLabel(start);
  return { slotStartTime: start, slotEndTime: end, label };
}

export function formatSlotLabel(isoStart: string): string {
  const d = parseISO(isoStart);
  if (!isValid(d)) return isoStart;
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Normalize GET /v1/bookings/slots or /slots/{date} payloads into slot buttons for one calendar day.
 */
export function normalizeSlotsForDate(raw: unknown, yyyyMmDd: string): ExpertTimeSlot[] {
  const rows: unknown[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const day = asRecord(item);
      if (day && Array.isArray(day.slots)) {
        rows.push(...day.slots);
      } else {
        rows.push(item);
      }
    }
  } else {
    const top = asRecord(raw);
    const data = top?.data ?? raw;
    if (Array.isArray(data)) {
      for (const item of data) {
        const day = asRecord(item);
        if (day && Array.isArray(day.slots)) {
          rows.push(...day.slots);
        } else {
          rows.push(item);
        }
      }
    } else if (Array.isArray((top as { slots?: unknown[] })?.slots)) {
      rows.push(...((top as { slots: unknown[] }).slots));
    }
  }

  const dayPrefix = yyyyMmDd.trim();
  const slots: ExpertTimeSlot[] = [];
  for (const item of rows) {
    const slot = slotFromUnknown(item);
    if (!slot) continue;
    if (slot.slotStartTime.slice(0, 10) !== dayPrefix) continue;
    slots.push(slot);
  }
  slots.sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));
  return dedupeSlots(slots);
}

function dedupeSlots(slots: ExpertTimeSlot[]): ExpertTimeSlot[] {
  const seen = new Set<string>();
  const out: ExpertTimeSlot[] = [];
  for (const s of slots) {
    const k = `${s.slotStartTime}|${s.slotEndTime}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

export type ParsedPaymentOrder = {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
};

/** Normalize POST /v1/payments/orders response for Razorpay Checkout */
export function parsePaymentOrderResponse(raw: unknown): ParsedPaymentOrder {
  const top = asRecord(raw) ?? {};
  const data = asRecord(top.data) ?? top;
  const razorpayOrderId = String(
    data.razorpay_order_id ?? data.order_id ?? data.id ?? data.razorpayOrderId ?? ""
  );
  const amountRaw = data.amount ?? data.amount_paise ?? data.amount_in_paise;
  const amountPaise = typeof amountRaw === "number" ? amountRaw : Number(amountRaw ?? 0);
  const currency = String(data.currency ?? "INR");
  const keyId = String(
    data.key_id ?? data.razorpay_key_id ?? data.public_key_id ?? data.keyId ?? ""
  );
  return {
    razorpayOrderId,
    amountPaise: Number.isFinite(amountPaise) ? amountPaise : 0,
    currency,
    keyId,
  };
}

export type UserBookingSummary = {
  id: string;
  status: string;
  slotDate: string;
  slotStartLabel: string;
  slotEndLabel: string;
  meetLink?: string | null;
  raw: Record<string, unknown>;
};

function formatBookingTime(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return iso;
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function normalizeMyBookings(raw: unknown): UserBookingSummary[] {
  const list = Array.isArray(raw) ? raw : (asRecord(raw)?.data as unknown[] | undefined) ?? [];
  if (!Array.isArray(list)) return [];

  const out: UserBookingSummary[] = [];
  for (const item of list) {
    const o = asRecord(item);
    if (!o) continue;
    const id = String(o.id ?? o.booking_id ?? "");
    if (!id) continue;
    const status = String(o.status ?? o.booking_status ?? "unknown");
    const slotDate = String(o.slot_date ?? o.slotDate ?? "").slice(0, 10);
    const startIso = String(o.slot_start_time ?? o.slotStartTime ?? "");
    const endIso = String(o.slot_end_time ?? o.slotEndTime ?? "");
    const meetLink =
      typeof o.google_meet_link === "string" && o.google_meet_link
        ? o.google_meet_link
        : typeof o.meet_link === "string"
          ? o.meet_link
          : typeof o.meeting_link === "string"
            ? o.meeting_link
            : typeof o.google_meet_url === "string"
              ? o.google_meet_url
              : null;
    out.push({
      id,
      status,
      slotDate,
      slotStartLabel: startIso ? formatBookingTime(startIso) : "—",
      slotEndLabel: endIso ? formatBookingTime(endIso) : "—",
      meetLink,
      raw: o,
    });
  }
  return out;
}

const normStatus = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_");

/** Booking exists and user should not start another reservation (incl. pending_payment). */
export function bookingIsBlockingNewRequest(b: UserBookingSummary): boolean {
  const s = normStatus(b.status);
  if (s.includes("cancel")) return false;
  if (s.includes("complete") || s.includes("done")) return false;
  if (s.includes("fail") || s.includes("expired")) return false;
  return true;
}

export function isPendingPaymentBooking(b: UserBookingSummary): boolean {
  return normStatus(b.status) === "pending_payment";
}

/** Show cancel when booking may still be cancellable (server has final say). */
export function canCancelBooking(b: UserBookingSummary): boolean {
  const s = normStatus(b.status);
  if (s.includes("cancel")) return false;
  if (s.includes("complete") || s.includes("done")) return false;
  return true;
}
