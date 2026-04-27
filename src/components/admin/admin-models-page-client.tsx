"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/client/api-client";
import { findSeoMetadataMatchForModel, getModelSeoCandidateKeys } from "@/lib/client/admin-seo-linking";
import { getModels } from "@/lib/client/catalogue-api";
import { listSeoMetadata, type SeoItem } from "@/lib/client/admin-seo-api";

const PAGE_SIZE = 10;

type CatalogueModel = Record<string, unknown> & { id?: string; model_name?: string; brand_name?: string };

function toText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function AdminModelsPageClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CatalogueModel[]>([]);
  const [seoRows, setSeoRows] = useState<SeoItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const [data, seoData] = await Promise.all([getModels(), listSeoMetadata()]);
      setRows((Array.isArray(data) ? data : []) as CatalogueModel[]);
      setSeoRows(seoData.items);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load catalogue models.";
      toast.error(message);
      setRows([]);
      setSeoRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const brandBuckets = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const row of rows) {
      const brand = row.brand && typeof row.brand === "object" ? (row.brand as Record<string, unknown>) : null;
      const key = String(row.brand_slug ?? row.brand_id ?? brand?.slug ?? brand?.id ?? brand?.name ?? "unknown").trim() || "unknown";
      const label = String(row.brand_name ?? brand?.name ?? key).trim() || "Unknown";
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { key, label, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((row) => {
      const brandObject = row.brand && typeof row.brand === "object" ? (row.brand as Record<string, unknown>) : null;
      const brandKey = String(row.brand_slug ?? row.brand_id ?? brandObject?.slug ?? brandObject?.id ?? brandObject?.name ?? "unknown").trim() || "unknown";
      if (selectedBrand !== "all" && brandKey !== selectedBrand) return false;
      const name = String(row.model_name ?? row.name ?? "").toLowerCase();
      const nestedBrand = row.brand && typeof row.brand === "object" ? String((row.brand as Record<string, unknown>).name ?? "") : "";
      const brandText = String(row.brand_name ?? nestedBrand).toLowerCase();
      const id = String(row.id ?? "").toLowerCase();
      if (!q) return true;
      return name.includes(q) || brandText.includes(q) || id.includes(q);
    });
  }, [rows, debouncedSearch, selectedBrand]);

  useEffect(() => setPage(1), [debouncedSearch, selectedBrand]);

  const selectedBrandLabel = useMemo(() => {
    if (selectedBrand === "all") return "All Brands";
    const bucket = brandBuckets.find((item) => item.key === selectedBrand);
    return bucket?.label ?? selectedBrand;
  }, [selectedBrand, brandBuckets]);

  const selectedBrandSeoStats = useMemo(() => {
    const configured = filtered.reduce((acc, row) => (findSeoMetadataMatchForModel(seoRows, row) ? acc + 1 : acc), 0);
    return { configured, missing: Math.max(0, filtered.length - configured) };
  }, [filtered, seoRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const pageRowIds = useMemo(() => pageRows.map((row, idx) => String(row.id ?? idx)), [pageRows]);
  const allExpandedOnPage = pageRowIds.length > 0 && pageRowIds.every((id) => expandedRowIds.includes(id));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Models & Cars"
        subtitle="Browse all models and open full detail pages for complete edit/update."
        onRefresh={loadModels}
      />

      <Card className="border-purple-100 bg-white">
        <CardHeader className="space-y-3">
          <CardTitle>Model Listing</CardTitle>
          <CardDescription>
            Brands: {brandBuckets.length} | Models: {filtered.length}
          </CardDescription>
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-700">Brand-first view</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={selectedBrand === "all" ? "default" : "outline"}
                className={selectedBrand === "all" ? "bg-purple-700 hover:bg-purple-800" : "border-purple-200"}
                onClick={() => setSelectedBrand("all")}
              >
                All Brands ({rows.length})
              </Button>
              {brandBuckets.map((bucket) => (
                <Button
                  key={bucket.key}
                  type="button"
                  size="sm"
                  variant={selectedBrand === bucket.key ? "default" : "outline"}
                  className={selectedBrand === bucket.key ? "bg-purple-700 hover:bg-purple-800" : "border-purple-200"}
                  onClick={() => setSelectedBrand(bucket.key)}
                >
                  {bucket.label} ({bucket.count})
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-purple-100 bg-purple-50/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-purple-700">Selected Brand</p>
              <p className="text-sm font-semibold text-zinc-900">{selectedBrandLabel}</p>
            </div>
            <div className="rounded-lg border border-purple-100 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Brands Total</p>
              <p className="text-sm font-semibold text-zinc-900">{brandBuckets.length}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-emerald-700">SEO Configured</p>
              <p className="text-sm font-semibold text-emerald-800">{selectedBrandSeoStats.configured}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-amber-700">SEO Missing</p>
              <p className="text-sm font-semibold text-amber-800">{selectedBrandSeoStats.missing}</p>
            </div>
          </div>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by model, brand, or id..." />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-purple-200"
              onClick={() => setExpandedRowIds(pageRowIds)}
              disabled={pageRowIds.length === 0 || allExpandedOnPage}
            >
              Expand All
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-purple-200"
              onClick={() => setExpandedRowIds([])}
              disabled={expandedRowIds.length === 0}
            >
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <AdminLoadingState label="Loading models..." />
          ) : filtered.length === 0 ? (
            <AdminEmptyState label="No models found." />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Brand</th>
                      <th className="px-4 py-3">Fuel Types</th>
                      <th className="px-4 py-3">Starting Price</th>
                      <th className="px-4 py-3">SEO</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, idx) => {
                        const rowId = String(row.id ?? idx);
                        const seoMatch = findSeoMetadataMatchForModel(seoRows, row);
                        const seoItem = seoMatch?.item ?? null;
                        const isExpanded = expandedRowIds.includes(rowId);
                        const brand = row.brand && typeof row.brand === "object" ? (row.brand as Record<string, unknown>) : null;
                        const brandName = toText(row.brand_name ?? brand?.name);
                        const fuelTypes = Array.isArray(row.fuel_types)
                          ? (row.fuel_types as unknown[]).map((item) => String(item)).filter(Boolean).join(", ")
                          : toText(row.fuel_type);
                        const imageUrl = String(row.hero_image_url ?? row.image_url ?? row.thumbnail_url ?? "");
                        return (
                          <Fragment key={rowId}>
                            <tr className="border-t border-purple-100">
                              <td className="px-4 py-3">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={String(row.model_name ?? row.name ?? "Model")}
                                    width={160}
                                    height={96}
                                    className="h-12 w-20 rounded-md border border-purple-100 object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-zinc-500">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-800">{String(row.model_name ?? row.name ?? "—")}</td>
                              <td className="px-4 py-3 text-sm text-zinc-700">{brandName}</td>
                              <td className="px-4 py-3 text-sm text-zinc-700">{fuelTypes}</td>
                              <td className="px-4 py-3 text-sm text-zinc-700">{String(row.starting_price ?? row.min_price ?? "—")}</td>
                              <td className="px-4 py-3 text-xs text-zinc-600">
                                {seoItem ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-emerald-700">Configured</span>
                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                      Matched by: {seoMatch?.matchedBy === "custom_slug" ? "custom_slug" : "entity_id"}
                                    </Badge>
                                  </div>
                                ) : (
                                  "Missing"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-200"
                                    onClick={() =>
                                      setExpandedRowIds((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]))
                                    }
                                  >
                                    {isExpanded ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}
                                    Inspect
                                  </Button>
                                  <Button asChild variant="outline" size="sm" className="border-purple-200">
                                    <Link href={`/admin/models/${encodeURIComponent(String(row.id ?? ""))}?mode=view`}>
                                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                                      View
                                    </Link>
                                  </Button>
                                  <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                    <Link href={`/admin/models/${encodeURIComponent(String(row.id ?? ""))}?mode=edit`}>
                                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                      Edit
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded ? (
                              <tr className="border-t border-purple-100 bg-purple-50/30">
                                <td colSpan={7} className="px-4 py-4">
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="overflow-hidden rounded-xl border border-purple-100 bg-white">
                                      <div className="border-b border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
                                        All Model Response Keys
                                      </div>
                                      <table className="w-full text-left">
                                        <tbody>
                                          {Object.entries(row).map(([key, value]) => (
                                            <tr key={key} className="border-t border-purple-100 first:border-t-0">
                                              <td className="w-1/3 px-3 py-2 text-xs text-zinc-700">{key}</td>
                                              <td className="px-3 py-2 text-xs text-zinc-700">
                                                <AdminValueRenderer fieldKey={key} value={value} />
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-purple-100 bg-white">
                                      <div className="border-b border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
                                        All SEO Response Keys
                                      </div>
                                      {seoItem ? (
                                        <table className="w-full text-left">
                                          <tbody>
                                            {Object.entries(seoItem).map(([key, value]) => (
                                              <tr key={key} className="border-t border-purple-100 first:border-t-0">
                                                <td className="w-1/3 px-3 py-2 text-xs text-zinc-700">{key}</td>
                                                <td className="px-3 py-2 text-xs text-zinc-700">
                                                  <AdminValueRenderer fieldKey={key} value={value} />
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="space-y-2 p-3 text-xs text-zinc-600">
                                          <p>No SEO metadata record found for this model.</p>
                                          <p className="text-[11px] text-zinc-500">
                                            Checked keys: {getModelSeoCandidateKeys(row).join(", ") || "none"}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-purple-200" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-200"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
