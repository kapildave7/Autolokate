"use client";

import { apiRequest } from "@/lib/client/api-client";

type Envelope<T> = { success?: boolean; data?: T };
const unbox = <T,>(res: Envelope<T> | T): T =>
  (res && typeof res === "object" && "data" in (res as Envelope<T>) ? ((res as Envelope<T>).data as T) : (res as T));

export async function getSeoPage(entityType: "brand" | "model" | "variant" | "city", slug: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/seo/page/${entityType}/${slug}`);
  return unbox(res);
}

export async function getSeoRedirect(path: string) {
  const res = await apiRequest<Envelope<unknown>>(`/v1/seo/redirects/${encodeURIComponent(path)}`);
  return unbox(res);
}

export async function getSeoRobots() {
  return apiRequest<string>("/v1/seo/robots");
}

export async function getSeoSitemapIndex() {
  return apiRequest<string>("/v1/seo/sitemap");
}
