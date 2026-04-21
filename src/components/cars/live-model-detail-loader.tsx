"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageFade } from "@/components/shared/page-fade";
import { LiveModelDetailView } from "@/components/cars/live-model-detail-view";
import { getBrandModels, getModelDetails, getModelVariants, getVariantDetails, searchCatalogue } from "@/lib/client/catalogue-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type Props = {
  slug?: string;
  brandSlug?: string;
  modelSlug?: string;
};

type ModelRow = Record<string, unknown>;
type VariantRow = Record<string, unknown>;
type ApiGroupRow = Record<string, unknown>;

function toPrice(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function toDisplayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const v = value.trim();
    return v ? v : null;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === "string" || typeof item === "number" ? String(item).trim() : ""))
      .filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  return null;
}

function pickDisplayFields(
  payload: Record<string, unknown>,
  blocked: string[]
): Array<{ key: string; label: string; value: string }> {
  const blockedSet = new Set(blocked);
  return Object.entries(payload)
    .filter(([key]) => !blockedSet.has(key))
    .map(([key, value]) => ({ key, label: humanizeKey(key), value: toDisplayValue(value) }))
    .filter((row): row is { key: string; label: string; value: string } => Boolean(row.value));
}

function normalizeSpecGroups(details: Record<string, unknown>): ApiGroupRow[] {
  const groupsMap = new Map<string, Map<string, ApiGroupRow>>();
  const pushRow = (groupName: string, key: string, row: ApiGroupRow) => {
    const normalizedGroup = groupName.trim().toLowerCase() || "other";
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) return;
    if (!groupsMap.has(normalizedGroup)) groupsMap.set(normalizedGroup, new Map<string, ApiGroupRow>());
    const groupBucket = groupsMap.get(normalizedGroup)!;
    if (!groupBucket.has(normalizedKey)) groupBucket.set(normalizedKey, row);
  };

  const grouped = Array.isArray(details.spec_groups) ? (details.spec_groups as ApiGroupRow[]) : [];
  for (const group of grouped) {
    const groupName = String(group.group ?? "other");
    const specs = Array.isArray(group.specs) ? (group.specs as ApiGroupRow[]) : [];
    for (const spec of specs) {
      const key = String(spec.key ?? spec.spec_key ?? spec.display_name ?? "").trim();
      const displayName = String(spec.display_name ?? spec.key ?? spec.spec_key ?? "").trim();
      const value = toDisplayValue(spec.value ?? spec.spec_value);
      if (!key || !value) continue;
      pushRow(groupName, key, {
        key,
        display_name: displayName || humanizeKey(key),
        value,
      });
    }
  }

  if (groupsMap.size === 0 && Array.isArray(details.specs)) {
    const flatSpecs = details.specs as ApiGroupRow[];
    for (const spec of flatSpecs) {
      const groupName = String(spec.spec_group ?? "other");
      const key = String(spec.spec_key ?? spec.key ?? "").trim();
      const value = toDisplayValue(spec.spec_value ?? spec.value);
      if (!key || !value) continue;
      pushRow(groupName, key, {
        key,
        display_name: String(spec.display_name ?? key),
        value,
      });
    }
  }

  return [...groupsMap.entries()].map(([group, rows]) => ({
    group,
    specs: [...rows.values()],
  }));
}

function normalizeFeatureGroups(details: Record<string, unknown>, variants: VariantRow[]): ApiGroupRow[] {
  const dedupRows = new Map<string, ApiGroupRow>();
  const featureGroups = Array.isArray(details.feature_groups) ? (details.feature_groups as ApiGroupRow[]) : [];
  const mergedFeatureValueMap: Record<string, Record<string, string>> = {};

  for (const group of featureGroups) {
    const rows = Array.isArray(group.features) ? (group.features as ApiGroupRow[]) : [];
    for (const row of rows) {
      const groupKey = String(row.key ?? row.display_name ?? "").trim().toLowerCase();
      const value = row.value;
      if (!groupKey || !value || typeof value !== "object") continue;
      const objectValue = value as Record<string, unknown>;
      if (!mergedFeatureValueMap[groupKey]) mergedFeatureValueMap[groupKey] = {};
      for (const [k, v] of Object.entries(objectValue)) {
        const displayValue = toDisplayValue(v);
        if (!displayValue) continue;
        if (!mergedFeatureValueMap[groupKey][k]) mergedFeatureValueMap[groupKey][k] = displayValue;
      }
      const dedupKey = groupKey;
      if (!dedupRows.has(dedupKey)) {
        dedupRows.set(dedupKey, {
          key: groupKey,
          display_name: groupKey,
          value: mergedFeatureValueMap[groupKey],
        });
      }
    }
  }

  if (dedupRows.size === 0) {
    for (const variant of variants) {
      const featureMap = (variant.features as Record<string, unknown> | undefined) ?? {};
      for (const [category, featureValues] of Object.entries(featureMap)) {
        if (!featureValues || typeof featureValues !== "object") continue;
        const groupKey = category.trim().toLowerCase();
        if (!groupKey) continue;
        if (!mergedFeatureValueMap[groupKey]) mergedFeatureValueMap[groupKey] = {};
        for (const [k, v] of Object.entries(featureValues as Record<string, unknown>)) {
          const displayValue = toDisplayValue(v);
          if (!displayValue) continue;
          if (!mergedFeatureValueMap[groupKey][k]) mergedFeatureValueMap[groupKey][k] = displayValue;
        }
      }
    }
    for (const [groupKey, value] of Object.entries(mergedFeatureValueMap)) {
      dedupRows.set(groupKey, { key: groupKey, display_name: groupKey, value });
    }
  }

  return [
    {
      group: "other",
      features: [...dedupRows.values()],
    },
  ];
}

function DetailPageLoaderSkeleton() {
  return (
    <PageFade>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-48 rounded-full" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[320px] rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="mt-6">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </PageFade>
  );
}

async function resolveBrandAndModelSlug(slug: string): Promise<{ brandSlug: string; modelSlug: string } | null> {
  const rows = await searchCatalogue(slug.replace(/-/g, " "));
  const wanted = slug.toLowerCase();
  const model = rows.find((row) => String((row as Record<string, unknown>).slug ?? "").toLowerCase() === wanted) as
    | Record<string, unknown>
    | undefined;
  if (!model) return null;
  const modelSlug = String(model.slug ?? "").trim();
  const brandObj = (model.brand as Record<string, unknown> | undefined) ?? {};
  const brandSlug = String(model.brand_slug ?? brandObj.slug ?? "").trim();
  if (!brandSlug || !modelSlug) return null;
  return { brandSlug, modelSlug };
}

async function fetchModelPayload(input: Props): Promise<{
  listing: ModelRow;
  details: ModelRow;
  variants: VariantRow[];
  modelImages: Record<string, unknown>[];
  modelColors: Record<string, unknown>[];
  specGroups: Record<string, unknown>[];
  featureGroups: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
}> {
  let brandSlug = String(input.brandSlug ?? "").trim();
  let modelSlug = String(input.modelSlug ?? input.slug ?? "").trim();
  if ((!brandSlug || !modelSlug) && input.slug) {
    const resolved = await resolveBrandAndModelSlug(input.slug);
    if (!resolved) throw new Error("Model not found");
    brandSlug = resolved.brandSlug;
    modelSlug = resolved.modelSlug;
  }
  if (!brandSlug || !modelSlug) throw new Error("Model not found");
  const loadByPair = async (brand: string, model: string) => {
    const [models, details, variants] = await Promise.all([
      getBrandModels(brand),
      getModelDetails(brand, model),
      getModelVariants(brand, model),
    ]);
    return { models, details, variants, brand, model };
  };

  let loaded: {
    models: Record<string, unknown>[];
    details: Record<string, unknown>;
    variants: Record<string, unknown>[];
    brand: string;
    model: string;
  };

  try {
    loaded = await loadByPair(brandSlug, modelSlug);
  } catch {
    // Route slugs can differ from canonical API slugs (e.g. tata-motors vs tata).
    const resolved = await resolveBrandAndModelSlug(modelSlug || input.slug || "");
    if (!resolved) throw new Error("Model not found");
    loaded = await loadByPair(resolved.brandSlug, resolved.modelSlug);
    brandSlug = resolved.brandSlug;
    modelSlug = resolved.modelSlug;
  }

  const { models, details, variants } = loaded;
  const listing =
    models.find((m) => String((m.slug as string | undefined) ?? "").toLowerCase() === modelSlug.toLowerCase()) ??
    (details as Record<string, unknown>);
  const withDetails = await Promise.all(
    variants.map(async (variant) => {
      const variantSlug = String((variant.slug as string | undefined) ?? "").trim();
      if (!variantSlug) return variant;
      try {
        const full = await getVariantDetails(brandSlug, modelSlug, variantSlug);
        return { ...variant, ...full };
      } catch {
        return variant;
      }
    })
  );
  const variantReviews = withDetails.flatMap((variant) => {
    const rows = (variant as Record<string, unknown>).reviews;
    return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  });
  const modelReviews = Array.isArray(details.reviews) ? (details.reviews as Record<string, unknown>[]) : [];
  const reviewMap = new Map<string, Record<string, unknown>>();
  [...modelReviews, ...variantReviews].forEach((review, idx) => {
    const id = String(review.id ?? review.title ?? review.heading ?? idx).trim();
    const key = id || `review-${idx}`;
    if (!reviewMap.has(key)) reviewMap.set(key, review);
  });
  return {
    listing: listing as ModelRow,
    details: (details as Record<string, unknown>) ?? {},
    variants: withDetails as VariantRow[],
    modelImages: Array.isArray(details.images) ? (details.images as Record<string, unknown>[]) : [],
    modelColors: Array.isArray(details.colors) ? (details.colors as Record<string, unknown>[]) : [],
    specGroups: normalizeSpecGroups((details as Record<string, unknown>) ?? {}),
    featureGroups: normalizeFeatureGroups((details as Record<string, unknown>) ?? {}, withDetails as VariantRow[]),
    reviews: [...reviewMap.values()],
  };
}

export function LiveModelDetailLoader(props: Props) {
  const queryKey = useMemo(
    () => ["live-model-detail", props.slug ?? null, props.brandSlug ?? null, props.modelSlug ?? null],
    [props.slug, props.brandSlug, props.modelSlug]
  );
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchModelPayload(props),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <DetailPageLoaderSkeleton />;
  }

  if (isError || !data) {
    return (
      <PageFade>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-foreground">This page is not available</h1>
          <p className="mt-3 text-sm text-muted-foreground">We could not load this model right now. Try explore or go back.</p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/cars/explore">Open explore</Link>
            </Button>
            <Button asChild>
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </div>
      </PageFade>
    );
  }

  const { listing, details, variants, modelImages, modelColors, specGroups, featureGroups, reviews } = data;
  const brand = String(details.brand_name ?? listing.brand_name ?? "Brand");
  const model = String(details.model_name ?? listing.model_name ?? listing.name ?? "Model");
  const bodyType = String(details.body_type ?? listing.body_type ?? "Body");
  const fuel = String(
    details.fuel_type ??
      (Array.isArray(details.fuel_types) && details.fuel_types.length ? details.fuel_types.join(", ") : undefined) ??
      listing.fuel_type ??
      (Array.isArray(listing.fuel_types) && listing.fuel_types.length ? listing.fuel_types.join(", ") : "Fuel")
  );
  const startingPrice = toPrice(details.starting_price ?? details.min_price ?? listing.starting_price ?? listing.min_price);
  const maxPrice = toPrice(details.max_price ?? listing.max_price);
  const heroImage = String(listing.hero_image_url ?? details.hero_image_url ?? "");
  const detailFields = pickDisplayFields((Object.keys(details).length ? details : listing) as Record<string, unknown>, [
    "id",
    "slug",
    "brand",
    "brand_name",
    "brand_slug",
    "model_name",
    "name",
    "description",
    "hero_image_url",
    "image_url",
    "thumbnail_url",
    "fuel_type",
    "fuel_types",
    "body_type",
    "starting_price",
    "min_price",
    "max_price",
    "created_at",
    "updated_at",
  ]);

  return (
    <PageFade>
      <LiveModelDetailView
        brand={brand}
        brandSlug={String(listing.brand_slug ?? props.brandSlug ?? "").trim()}
        model={model}
        modelSlug={String(listing.slug ?? props.modelSlug ?? props.slug ?? "")}
        bodyType={bodyType}
        fuel={fuel}
        description={
          typeof details.description === "string" && details.description.trim()
            ? details.description
            : `Explore live catalogue details for ${brand} ${model}, including variants, features, and latest pricing.`
        }
        heroImage={heroImage}
        startingPrice={startingPrice}
        maxPrice={maxPrice}
        detailFields={detailFields}
        variants={variants}
        modelImages={modelImages}
        modelColors={modelColors}
        specGroups={specGroups}
        featureGroups={featureGroups}
        reviews={reviews}
      />
    </PageFade>
  );
}
