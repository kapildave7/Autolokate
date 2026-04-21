"use client";

import { Fragment, useMemo } from "react";
import { Minus, Trophy } from "lucide-react";
import { RemoteImageWithFallback } from "@/components/ui/remote-image";
import { Badge } from "@/components/ui/badge";
import { cn, formatINR } from "@/lib/utils";
import {
  labelForCompareRowKey,
  orderedCompareAttributeKeys,
  type TaxonomyLabelMaps,
} from "@/lib/taxonomy-labels";

const BLOCKED_KEYS = new Set([
  "id",
  "brand",
  "created_at",
  "updated_at",
  "hero_image_url",
  "thumbnail_url",
]);

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    const looksLikePrice =
      /price|ex_showroom|on.?road|emi/i.test(key) || key === "min_price" || key === "max_price";
    if (looksLikePrice && value >= 1000) return formatINR(value);
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.trim() || "—";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ") || "—";
  return "—";
}

function isCellPresent(value: string): boolean {
  const v = value.trim();
  return v !== "" && v !== "—" && v.toLowerCase() !== "n/a" && v.toLowerCase() !== "null";
}

function rowDiffers(values: string[]): boolean {
  if (values.length < 2) return false;
  const first = values[0];
  return values.some((v) => v !== first);
}

type Props = {
  variants: Record<string, unknown>[];
  labelMaps: TaxonomyLabelMaps | null;
};

type Row = {
  key: string;
  label: string;
  values: string[];
  section: string;
};

function humanizeSection(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function CompareCatalogueMatrix({ variants, labelMaps }: Props) {
  const rows = useMemo<Row[]>(() => {
    if (variants.length < 2) return [];
    const scalarKeys = new Set<string>();
    const featureKeys = new Set<string>();

    for (const v of variants) {
      Object.keys(v).forEach((k) => {
        if (!BLOCKED_KEYS.has(k) && k !== "features") scalarKeys.add(k);
      });
      const features = v.features;
      if (features && typeof features === "object") {
        const groups = features as Record<string, unknown>;
        for (const [group, fields] of Object.entries(groups)) {
          if (!fields || typeof fields !== "object") continue;
          for (const fieldName of Object.keys(fields as Record<string, unknown>)) {
            featureKeys.add(`feature::${group}::${fieldName}`);
          }
        }
      }
    }

    const orderedScalar = orderedCompareAttributeKeys(scalarKeys, BLOCKED_KEYS, labelMaps).map((key) => ({
      key,
      label: labelForCompareRowKey(key, labelMaps),
      values: variants.map((v) => formatCell(key, v[key])),
      section: "Core specs",
    }));

    const orderedFeatures = [...featureKeys]
      .sort((a, b) => a.localeCompare(b))
      .map((compound) => {
        const [, rawGroup, rawName] = compound.split("::");
        const section = humanizeSection(rawGroup ?? "Features");
        const label = rawName ?? "Feature";
        const values = variants.map((v) => {
          const groups = (v.features as Record<string, unknown> | undefined) ?? {};
          const fields = groups[rawGroup ?? ""] as Record<string, unknown> | undefined;
          return formatCell(label, fields?.[label]);
        });
        return {
          key: compound,
          label,
          values,
          section,
        };
      });

    return [...orderedScalar, ...orderedFeatures].filter((row) => row.values.every(isCellPresent));
  }, [variants, labelMaps]);

  const accent = "bg-primary/8 ring-1 ring-primary/25";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="max-h-[72vh] overflow-auto [-ms-overflow-style:none] [scrollbar-width:thin]">
        <table className="w-full min-w-[min(100%,720px)] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="[&_th]:border-b [&_th]:border-border">
              <th
                scope="col"
                className="sticky left-0 top-0 z-4 min-w-38 bg-muted/95 px-3 py-3 text-left align-bottom backdrop-blur-sm sm:min-w-42 sm:px-4 sm:py-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Spec</span>
              </th>
              {variants.map((v, colIdx) => {
                const img =
                  (typeof v.image_url === "string" && v.image_url) ||
                  (typeof v.hero_image_url === "string" && v.hero_image_url) ||
                  "";
                const title = String(v.variant_name ?? v.name ?? `Variant ${colIdx + 1}`);
                const brand = String(v.brand_name ?? "");
                const model = String(v.model_name ?? "");
                const priceRaw = v.ex_showroom_price ?? v.min_price ?? v.max_price;
                const price =
                  typeof priceRaw === "number" && priceRaw >= 1000
                    ? formatINR(priceRaw)
                    : typeof priceRaw === "string"
                      ? priceRaw
                      : "—";

                return (
                  <th
                    key={String(v.id ?? colIdx)}
                    scope="col"
                    className="sticky top-0 z-3 min-w-44 border-l border-border/70 bg-background/95 px-3 py-3 text-left align-bottom backdrop-blur-sm sm:min-w-50 sm:px-4 sm:py-4"
                  >
                    <div className="relative mb-3 aspect-16/10 w-full overflow-hidden rounded-xl border border-border bg-muted/40">
                      {img ? (
                        <RemoteImageWithFallback src={img} alt="" fill className="object-cover" sizes="200px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
                      )}
                      <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-md bg-background/95 px-1.5 text-[10px] font-bold text-foreground shadow-sm ring-1 ring-border">
                        {colIdx + 1}
                      </span>
                    </div>
                    <p className="font-display text-sm font-bold leading-snug tracking-tight text-foreground">{brand}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-medium text-muted-foreground">{model}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-foreground">{title}</p>
                    <Badge variant="secondary" className="mt-2 border-border bg-muted/60 text-[11px] font-semibold">
                      {price}
                    </Badge>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const diff = rowDiffers(row.values);
              const stripe = rowIdx % 2 === 0;
              const prevSection = rowIdx > 0 ? rows[rowIdx - 1]?.section : null;
              const showSection = row.section !== prevSection;
              return (
                <Fragment key={row.key}>
                  {showSection ? (
                    <tr key={`${row.key}-section`}>
                      <th
                        colSpan={variants.length + 1}
                        className="border-b border-border bg-muted/70 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground"
                      >
                        {row.section}
                      </th>
                    </tr>
                  ) : null}
                  <tr className="group">
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-1 border-b border-border/80 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[6px_0_24px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-4 sm:py-3",
                        stripe ? "bg-muted/70" : "bg-card/95"
                      )}
                    >
                      {row.label}
                    </th>
                    {row.values.map((cell, i) => (
                      <td
                        key={i}
                        className={cn(
                          "border-b border-l border-border/60 px-3 py-2.5 align-middle text-sm text-foreground sm:px-4 sm:py-3",
                          stripe ? "bg-muted/40" : "bg-background/90",
                          diff && accent
                        )}
                      >
                        <span className="font-medium leading-snug">{cell}</span>
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <div className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No comparable fields with values for all selected variants.
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Trophy className="h-3 w-3" aria-hidden />
          </span>
          Rows with differences are tinted (same value in all columns = neutral).
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="h-3.5 w-3.5 opacity-60" aria-hidden />
          Ex-showroom data from catalogue API; specs vary by OEM updates.
        </span>
      </div>
    </div>
  );
}
