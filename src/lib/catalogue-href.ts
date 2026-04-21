/**
 * Build in-app links for catalogue search rows (brands, models, variants).
 * Model pages live at `/cars/[brandSlug]/[modelSlug]` (or legacy `/cars/[modelSlug]`); brands at `/brands/[brandSlug]`.
 */

export function catalogueResultHref(row: Record<string, unknown>): string | null {
  const brandSlug = String(row.brand_slug ?? "").trim();
  const modelSlug = String(row.model_slug ?? "").trim();
  const modelName = row.model_name;
  const variantName = row.variant_name;
  const slug = String(row.slug ?? "").trim();

  if (variantName && (modelSlug || slug)) {
    const m = modelSlug || slug;
    return brandSlug && m ? `/cars/${encodeURIComponent(brandSlug)}/${encodeURIComponent(m)}` : m ? `/cars/${encodeURIComponent(m)}` : null;
  }

  if (modelName && slug && !variantName) {
    return brandSlug
      ? `/cars/${encodeURIComponent(brandSlug)}/${encodeURIComponent(slug)}`
      : `/cars/${encodeURIComponent(slug)}`;
  }

  const looksLikeBrandOnly = Boolean(slug) && !modelName && !variantName;
  if (looksLikeBrandOnly) {
    return `/brands/${encodeURIComponent(slug)}`;
  }

  if (brandSlug && !modelName && !variantName) {
    return `/brands/${encodeURIComponent(brandSlug)}`;
  }

  return null;
}

export function catalogueResultLabel(row: Record<string, unknown>): string {
  const vn = row.variant_name;
  const mn = (row.model_name ?? row.name) as string | undefined;
  const brand =
    String(row.brand_name ?? "").trim() ||
    String((row.brand as Record<string, unknown> | undefined)?.name ?? "").trim();
  if (vn) return [brand, mn, String(vn)].filter(Boolean).join(" ");
  if (mn) return [brand, String(mn)].filter(Boolean).join(" ");
  return String(row.brand_name ?? row.name ?? row.slug ?? "Result");
}

export function catalogueResultKind(row: Record<string, unknown>): "brand" | "model" | "variant" {
  if (row.variant_name) return "variant";
  if (row.model_name) return "model";
  return "brand";
}
