"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T };
const unbox = <T,>(res: Envelope<T> | T): T =>
  (res && typeof res === "object" && "data" in (res as Envelope<T>) ? ((res as Envelope<T>).data as T) : (res as T));

export async function getTco(variantId: string, city: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/prices/tco/${variantId}?city=${encodeURIComponent(city)}`);
  return unbox(res);
}

export async function getEmi(params: { principal: number; rate: number; tenure: number }) {
  const q = new URLSearchParams({
    principal: String(params.principal),
    rate: String(params.rate),
    tenure: String(params.tenure),
  });
  const res = await apiRequest<Envelope<unknown>>(`/v1/prices/emi?${q.toString()}`);
  return unbox(res);
}

export async function getResale(variantId: string, year = 3) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/prices/resale/${variantId}?year=${year}`);
  return unbox(res);
}

export { getEvSubsidies } from "@/lib/client/prices-api";

export async function getFuelPrice(city: string, fuel: string) {
  const res = await apiRequest<Envelope<unknown>>(
    `/v1/prices/fuel?city=${encodeURIComponent(city)}&fuel=${encodeURIComponent(fuel)}`
  );
  return unbox(res);
}
