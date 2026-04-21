import type { DealerDetailPayload, DealerReviewRow, DealerRow } from "@/lib/dealers/dealer-types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/** Unbox `{ success, data: T }` — returns inner `data` when present. */
export function unboxEnvelope(res: unknown): unknown {
  if (!isRecord(res)) return res;
  if ("data" in res && res.data !== undefined) return res.data;
  return res;
}

export function normalizeDealerRow(raw: unknown): DealerRow | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  return {
    id,
    partner_type: typeof raw.partner_type === "string" ? raw.partner_type : null,
    name: typeof raw.name === "string" ? raw.name : "Dealer",
    city_id: typeof raw.city_id === "string" ? raw.city_id : null,
    address: typeof raw.address === "string" ? raw.address : null,
    location: raw.location ?? null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    email: typeof raw.email === "string" ? raw.email : null,
    website: typeof raw.website === "string" ? raw.website : null,
    rating: typeof raw.rating === "number" ? raw.rating : raw.rating != null ? Number(raw.rating) : null,
    review_count:
      typeof raw.review_count === "number" ? raw.review_count : raw.review_count != null ? Number(raw.review_count) : null,
    is_verified: typeof raw.is_verified === "boolean" ? raw.is_verified : null,
    is_active: typeof raw.is_active === "boolean" ? raw.is_active : null,
    metadata: raw.metadata ?? null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

export function normalizeReviewRow(raw: unknown): DealerReviewRow | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  return {
    id,
    partner_id: typeof raw.partner_id === "string" ? raw.partner_id : "",
    user_id: typeof raw.user_id === "string" ? raw.user_id : null,
    rating: typeof raw.rating === "number" ? raw.rating : raw.rating != null ? Number(raw.rating) : null,
    review_text: typeof raw.review_text === "string" ? raw.review_text : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
  };
}

/** Parse GET /v1/dealers list envelope: `{ data: { data: Dealer[], count } }`. */
export function parseDealersListPayload(payload: unknown): DealerRow[] {
  const inner = unboxEnvelope(payload);
  if (Array.isArray(inner)) {
    return inner.map(normalizeDealerRow).filter((x): x is DealerRow => Boolean(x));
  }
  if (isRecord(inner) && Array.isArray(inner.data)) {
    return inner.data.map(normalizeDealerRow).filter((x): x is DealerRow => Boolean(x));
  }
  return [];
}

/** Parse GET /v1/dealers/:id — `{ data: { dealer, reviews } }`. */
export function parseDealerDetailPayload(payload: unknown): DealerDetailPayload | null {
  const inner = unboxEnvelope(payload);
  if (!isRecord(inner)) return null;
  const dealerRaw = inner.dealer;
  const dealer = normalizeDealerRow(dealerRaw);
  if (!dealer) return null;
  const revRaw = inner.reviews;
  const reviews = Array.isArray(revRaw)
    ? revRaw.map(normalizeReviewRow).filter((x): x is DealerReviewRow => Boolean(x))
    : [];
  return { dealer, reviews };
}

export const DEALER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDealerIdParam(param: string): boolean {
  return DEALER_UUID_RE.test(param.trim());
}
