"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T };
const unbox = <T,>(res: Envelope<T> | T): T =>
  (res && typeof res === "object" && "data" in (res as Envelope<T>) ? ((res as Envelope<T>).data as T) : (res as T));

export async function getBookingSlots(params?: { date?: string; range_days?: number }) {
  const q = new URLSearchParams();
  if (params?.date) q.set("date", params.date);
  if (params?.range_days != null) q.set("range_days", String(params.range_days));
  const res = await apiRequest<Envelope<unknown[]>>(`/v1/bookings/slots${q.toString() ? `?${q.toString()}` : ""}`, {
    auth: true,
  });
  return unbox(res) ?? [];
}

export async function getBookingSlotsByDate(dateIso: string) {
  const res = await apiRequest<Envelope<unknown[]>>(`/v1/bookings/slots/${dateIso}`, { auth: true });
  return unbox(res) ?? [];
}

export type BookingType = "founder_call" | "test_drive" | "service_appointment" | "consultation";

/**
 * POST /v1/bookings/book — payload matches `CreateBookingDto` from the OpenAPI spec.
 * Only the fields declared in the DTO are sent to avoid validation rejections.
 */
export async function createBooking(payload: {
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  booking_type: BookingType;
  car_profile_id?: string;
}) {
  const body: Record<string, unknown> = {
    slot_date: payload.slot_date,
    slot_start_time: payload.slot_start_time,
    slot_end_time: payload.slot_end_time,
    booking_type: payload.booking_type,
  };
  if (payload.car_profile_id) body.car_profile_id = payload.car_profile_id;

  const res = await apiRequest<Envelope<unknown>>("/v1/bookings/book", {
    method: "POST",
    auth: true,
    body,
  });
  return unbox(res);
}

export async function getMyBookings() {
  const res = await apiRequest<Envelope<unknown[]>>("/v1/bookings/my", { auth: true });
  return unbox(res) ?? [];
}

export async function getBookingById(bookingId: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/bookings/${bookingId}`, { auth: true });
  return unbox(res);
}

export async function cancelBooking(bookingId: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/bookings/${bookingId}/cancel`, {
    method: "POST",
    auth: true,
  });
  return unbox(res);
}
