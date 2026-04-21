import type { TaxonomyFeatureRow, TaxonomySpecRow } from "@/lib/client/taxonomy-api";
import { formatEngineDisplacementCc } from "@/lib/utils";

export type TaxonomyLabelMaps = {
  specByKey: Map<string, TaxonomySpecRow>;
  featureByKey: Map<string, TaxonomyFeatureRow>;
};

export function buildTaxonomyLabelMaps(specs: TaxonomySpecRow[], features: TaxonomyFeatureRow[]): TaxonomyLabelMaps {
  const specByKey = new Map<string, TaxonomySpecRow>();
  for (const s of specs) {
    if (s.canonical_key) specByKey.set(s.canonical_key, s);
  }
  const featureByKey = new Map<string, TaxonomyFeatureRow>();
  for (const f of features) {
    if (f.canonical_key) featureByKey.set(f.canonical_key, f);
  }
  return { specByKey, featureByKey };
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Format a scalar variant field using taxonomy units (e.g. mm, kWh) and engine-cc rules. */
export function formatVariantSpecDisplay(key: string, value: unknown, maps: TaxonomyLabelMaps | null): string {
  const k = key.toLowerCase();
  if (k === "engine_cc" || k === "engine_displacement") {
    return formatEngineDisplacementCc(value);
  }
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  const spec = maps?.specByKey.get(key);
  if (spec?.data_type === "number") {
    const raw = typeof value === "number" ? value : String(value).replace(/,/g, "").trim();
    const n = Number(raw);
    if (Number.isFinite(n)) {
      const formatted = Number.isInteger(n)
        ? n.toLocaleString("en-IN")
        : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
      if (spec.unit) return `${formatted} ${spec.unit}`.trim();
      return formatted;
    }
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-IN")
      : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(value);
}

/** Prefer taxonomy display name; fall back to Title Case from API key. */
export function labelForVariantFieldKey(key: string, maps: TaxonomyLabelMaps): string {
  const spec = maps.specByKey.get(key);
  if (spec?.display_name) return spec.display_name;
  const feat = maps.featureByKey.get(key);
  if (feat?.display_name) return feat.display_name;
  return humanizeKey(key);
}

/** Row label for catalogue compare / raw variant objects. */
export function labelForCompareRowKey(key: string, maps: TaxonomyLabelMaps | null): string {
  if (!maps) return humanizeKey(key);
  return labelForVariantFieldKey(key, maps);
}

/** Feature map keys may be canonical (`ac`) or already human-readable from the API. */
export function labelForFeatureRowKey(name: string, maps: TaxonomyLabelMaps | null): string {
  const f = maps?.featureByKey.get(name);
  if (f?.display_name) return f.display_name;
  if (name.includes(" ") || /[A-Z][a-z]/.test(name)) return name;
  return humanizeKey(name);
}

export function specSortMeta(key: string, maps: TaxonomyLabelMaps | null): { group: string; order: number } {
  if (!maps) return { group: "zzz", order: 9999 };
  const row = maps.specByKey.get(key);
  if (row) return { group: row.spec_group, order: row.sort_order };
  const feat = maps.featureByKey.get(key);
  if (feat) return { group: feat.feature_group, order: feat.sort_order };
  return { group: "zzz", order: 9999 };
}

const DEFAULT_LEAD_KEYS = [
  "variant_name",
  "name",
  "fuel_type",
  "fuel",
  "transmission",
  "ex_showroom_price",
  "min_price",
  "max_price",
  "mileage_kmpl",
  "mileage",
  "engine_cc",
  "engine",
  "power_hp",
  "power",
  "torque_nm",
  "torque",
];

/** Order attribute keys for catalogue compare: lead keys first, then taxonomy order, then A–Z. */
export function orderedCompareAttributeKeys(
  keys: Set<string>,
  blocked: Set<string>,
  maps: TaxonomyLabelMaps | null
): string[] {
  const list = [...keys].filter((k) => !blocked.has(k));
  const lead = DEFAULT_LEAD_KEYS.filter((k) => list.includes(k));
  const rest = list.filter((k) => !DEFAULT_LEAD_KEYS.includes(k));
  rest.sort((a, b) => {
    const ma = specSortMeta(a, maps);
    const mb = specSortMeta(b, maps);
    if (ma.group !== mb.group) return ma.group.localeCompare(mb.group);
    if (ma.order !== mb.order) return ma.order - mb.order;
    return a.localeCompare(b);
  });
  return [...lead, ...rest];
}
