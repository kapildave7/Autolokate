import type { SeoItem } from "@/lib/client/admin-seo-api";

type ModelRow = Record<string, unknown>;
export type SeoModelMatchBy = "entity_id" | "custom_slug";
export type SeoModelMatchResult = { item: SeoItem; matchedBy: SeoModelMatchBy };

function normalized(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function normalizedSlug(value: unknown): string {
  const text = normalized(value);
  if (!text) return "";
  const withoutQuery = text.split(/[?#]/)[0] ?? "";
  const normalizedPath = withoutQuery.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  return normalizedPath;
}

function slugVariants(value: unknown): Set<string> {
  const variants = new Set<string>();
  const base = normalizedSlug(value);
  if (!base) return variants;

  variants.add(base);
  const parts = base.split("/").filter(Boolean);
  if (parts.length > 0) {
    variants.add(parts[parts.length - 1] ?? "");
  }
  if (parts.length > 1) {
    variants.add(`${parts[parts.length - 2]}/${parts[parts.length - 1]}`);
  }
  return variants;
}

function modelCandidateKeys(model: ModelRow): Set<string> {
  const keys = new Set<string>();
  const id = normalized(model.id);
  const modelId = normalized(model.model_id);
  const slug = model.slug ?? model.model_slug;
  const brandSlug = model.brand_slug;

  if (id) keys.add(id);
  if (modelId) keys.add(modelId);
  for (const value of slugVariants(slug)) keys.add(value);
  for (const value of slugVariants(brandSlug)) keys.add(value);

  const normalizedModelSlug = normalizedSlug(slug);
  const normalizedBrandSlug = normalizedSlug(brandSlug);
  if (normalizedBrandSlug && normalizedModelSlug) {
    keys.add(`${normalizedBrandSlug}/${normalizedModelSlug}`);
    keys.add(`cars/${normalizedBrandSlug}/${normalizedModelSlug}`);
    keys.add(`models/${normalizedBrandSlug}/${normalizedModelSlug}`);
  }
  return keys;
}

export function findSeoMetadataForModel(seoRows: SeoItem[], model: ModelRow): SeoItem | null {
  return findSeoMetadataMatchForModel(seoRows, model)?.item ?? null;
}

export function getModelSeoCandidateKeys(model: ModelRow): string[] {
  return Array.from(modelCandidateKeys(model)).filter(Boolean);
}

function isModelEntityType(value: unknown): boolean {
  const entityType = normalized(value);
  if (!entityType) return true;
  return entityType === "model" || entityType === "models" || entityType.includes("model");
}

export function findSeoMetadataMatchForModel(seoRows: SeoItem[], model: ModelRow): SeoModelMatchResult | null {
  const candidates = modelCandidateKeys(model);
  if (!candidates.size) return null;

  for (const item of seoRows) {
    if (!isModelEntityType(item.entity_type)) continue;

    const entityId = normalized(item.entity_id);
    const entityIdCandidates = new Set<string>([entityId, ...slugVariants(item.entity_id)]);
    if (Array.from(entityIdCandidates).some((value) => value && candidates.has(value))) {
      return { item, matchedBy: "entity_id" };
    }

    const customSlug = normalizedSlug(item.custom_slug);
    const customSlugCandidates = new Set<string>([customSlug, ...slugVariants(item.custom_slug)]);
    if (Array.from(customSlugCandidates).some((value) => value && candidates.has(value))) {
      return { item, matchedBy: "custom_slug" };
    }
  }
  return null;
}
