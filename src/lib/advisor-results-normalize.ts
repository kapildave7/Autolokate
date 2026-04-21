import { formatINR } from "@/lib/utils";

export type AdvisorMatchCard = {
  id: string;
  title: string;
  subtitle: string;
  variantLine: string | null;
  imageUrl: string | null;
  imageAlt: string;
  priceLabel: string;
  score: number | null;
  mileageKmpl: number | null;
  href: string | null;
  reasons: string[];
  sortPriceMin: number;
  sortPriceMax: number;
  /** Catalogue variant UUID for `/v1/catalogue/compare` when present in API payload. */
  catalogueVariantId: string | null;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Unwrap envelope / nested `data` so we read `models` or legacy `results`. */
export function unwrapAdvisorResultsPayload(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  if (Array.isArray(payload.models)) return payload;
  if (isRecord(payload.data)) {
    const d = payload.data as Record<string, unknown>;
    if (Array.isArray(d.models)) return d;
  }
  return payload;
}

export function advisorResultsMeta(payload: unknown): { totalMatches?: number; aiSummary?: string | null } {
  const inner = unwrapAdvisorResultsPayload(payload);
  if (!inner) return {};
  const total =
    typeof inner.total_matches === "number"
      ? inner.total_matches
      : Array.isArray(inner.models)
        ? inner.models.length
        : undefined;
  const aiSummary =
    inner.ai_summary === null
      ? null
      : typeof inner.ai_summary === "string"
        ? inner.ai_summary
        : undefined;
  return { totalMatches: total, aiSummary };
}

function fromAdvisorModel(m: unknown, idx: number): AdvisorMatchCard | null {
  if (!isRecord(m)) return null;
  const model_id = String(m.model_id ?? `model-${idx}`);
  const model_name = String(m.model_name ?? "Model").trim() || "Model";
  const brand_name = String(m.brand_name ?? "").trim();
  const model_slug = String(m.model_slug ?? "").trim();
  const body_type = String(m.body_type ?? "").trim();
  const min_price = Number(m.min_price ?? 0);
  const max_price = Number(m.max_price ?? 0);
  const fuel_types = Array.isArray(m.fuel_types) ? m.fuel_types.map((x) => String(x)) : [];
  const top = isRecord(m.top_variant) ? m.top_variant : null;
  const ex = top ? Number(top.ex_showroom_price ?? 0) : 0;
  const mileageRaw = top?.mileage_kmpl;
  const mileageKmpl =
    mileageRaw != null && mileageRaw !== "" && Number.isFinite(Number(mileageRaw)) ? Number(mileageRaw) : null;
  const variantName = top && typeof top.name === "string" ? top.name.trim() : "";
  const score =
    m.recommendation_score != null && m.recommendation_score !== ""
      ? Number(m.recommendation_score)
      : null;
  const reasons = Array.isArray(m.match_reasons)
    ? m.match_reasons.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const imageUrl = typeof m.image_url === "string" && m.image_url.startsWith("http") ? m.image_url : null;

  const fuelStr = fuel_types.map((f) => f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()).join(", ");
  const bodyLabel = body_type ? body_type.charAt(0).toUpperCase() + body_type.slice(1).toLowerCase() : "";
  const subtitle = [brand_name || null, bodyLabel || null, fuelStr || null].filter(Boolean).join(" · ");

  let priceLabel = "—";
  if (min_price > 0 && max_price > 0 && min_price !== max_price) {
    priceLabel = `${formatINR(min_price)} – ${formatINR(max_price)}`;
  } else if (max_price > 0 && min_price === max_price) {
    priceLabel = formatINR(max_price);
  } else if (min_price > 0) {
    priceLabel = `From ${formatINR(min_price)}`;
  } else if (ex > 0) {
    priceLabel = `From ${formatINR(ex)}`;
  }

  // Use /cars/[slug] (catalogue model page). /new-cars/* is redirected to / by middleware.
  const href = model_slug ? `/cars/${encodeURIComponent(model_slug)}` : null;

  const imageAlt = [brand_name, model_name].filter(Boolean).join(" ") || model_name;

  const catalogueVariantId =
    top && typeof top.id === "string" && top.id.length >= 8 ? top.id : null;

  return {
    id: model_id,
    title: model_name,
    subtitle: subtitle || "New car match",
    variantLine: variantName || null,
    imageUrl,
    imageAlt,
    priceLabel,
    score: score != null && Number.isFinite(score) ? score : null,
    mileageKmpl,
    href,
    reasons,
    sortPriceMin: min_price > 0 ? min_price : ex > 0 ? ex : 0,
    sortPriceMax: max_price > 0 ? max_price : ex > 0 ? ex : min_price > 0 ? min_price : 0,
    catalogueVariantId,
  };
}

function fromLegacyRow(m: unknown, idx: number): AdvisorMatchCard | null {
  if (!isRecord(m)) return null;
  const id = String(m.id ?? m.model_id ?? `match-${idx}`);
  const title = String(m.variant_name || m.model_name || m.name || m.title || `Match ${idx + 1}`);
  const subtitle = String(m.brand_name || m.rationale || m.reason || "Advisor pick");
  const p = Number(m.price ?? m.on_road_price ?? 0);
  const scoreRaw = m.score ?? m.confidence;
  const score = scoreRaw != null && scoreRaw !== "" && Number.isFinite(Number(scoreRaw)) ? Number(scoreRaw) : null;
  const imageUrl = typeof m.image_url === "string" && m.image_url.startsWith("http") ? m.image_url : null;
  const catalogueVariantId = typeof m.variant_id === "string" && m.variant_id.length >= 8 ? m.variant_id : null;

  return {
    id,
    title,
    subtitle,
    variantLine: null,
    imageUrl,
    imageAlt: title,
    priceLabel: p > 0 ? formatINR(p) : "—",
    score,
    mileageKmpl: null,
    href: null,
    reasons: [],
    sortPriceMin: p,
    sortPriceMax: p,
    catalogueVariantId,
  };
}

/** Normalises staging `data.models` and older `results` / array shapes into one card model. */
export function normalizeAdvisorResultsToMatches(payload: unknown): AdvisorMatchCard[] {
  const inner = unwrapAdvisorResultsPayload(payload);
  if (!inner) return [];

  if (Array.isArray(inner.models)) {
    return inner.models.map((m, i) => fromAdvisorModel(m, i)).filter((x): x is AdvisorMatchCard => Boolean(x));
  }

  if (Array.isArray(inner.results)) {
    return inner.results.map((m, i) => fromLegacyRow(m, i)).filter((x): x is AdvisorMatchCard => Boolean(x));
  }

  if (Array.isArray(inner.data) && inner.data.every((x) => isRecord(x))) {
    return (inner.data as unknown[]).map((m, i) => fromLegacyRow(m, i)).filter((x): x is AdvisorMatchCard => Boolean(x));
  }

  if (Array.isArray(payload)) {
    return payload.map((m, i) => fromLegacyRow(m, i)).filter((x): x is AdvisorMatchCard => Boolean(x));
  }

  return [];
}
