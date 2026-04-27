"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { isReadOnly, readDetailMode } from "@/components/admin/ui/detail-mode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/client/api-client";
import { patchCatalogueModelById } from "@/lib/client/admin-catalogue-api";
import { findSeoMetadataForModel } from "@/lib/client/admin-seo-linking";
import { listSeoMetadata, upsertSeoMetadata, type SeoItem } from "@/lib/client/admin-seo-api";
import { getModels, getModelVariants } from "@/lib/client/catalogue-api";

type ModelRow = Record<string, unknown>;
type Props = { modelId: string };

type ModelFormState = {
  brandId: string;
  name: string;
  slug: string;
  vehicleCategory: string;
  bodyType: string;
  fuelTypesCsv: string;
  launchYear: string;
  isDiscontinued: boolean;
  minPrice: string;
  maxPrice: string;
  heroImageUrl: string;
};

function toStr(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function AdminModelDetailPageClient({ modelId }: Props) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState<ModelRow | null>(null);
  const [seoRows, setSeoRows] = useState<SeoItem[]>([]);
  const [variants, setVariants] = useState<Record<string, unknown>[]>([]);
  const [modelForm, setModelForm] = useState<ModelFormState>({
    brandId: "",
    name: "",
    slug: "",
    vehicleCategory: "",
    bodyType: "",
    fuelTypesCsv: "",
    launchYear: "",
    isDiscontinued: false,
    minPrice: "",
    maxPrice: "",
    heroImageUrl: "",
  });

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [priority, setPriority] = useState("0.8");
  const [changefreq, setChangefreq] = useState("weekly");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allModels, allSeo] = await Promise.all([getModels(), listSeoMetadata()]);
      const selected = (allModels as ModelRow[]).find((item) => String(item.id ?? "") === modelId) ?? null;
      setModel(selected);
      setSeoRows(allSeo.items);
      if (selected) {
        const brandSlug = String(selected.brand_slug ?? "");
        const modelSlug = String(selected.slug ?? selected.model_slug ?? "");
        if (brandSlug && modelSlug) {
          const loadedVariants = await getModelVariants(brandSlug, modelSlug);
          setVariants(loadedVariants as Record<string, unknown>[]);
        } else {
          setVariants([]);
        }
      } else {
        setVariants([]);
      }
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load model details.";
      toast.error(message);
      setModel(null);
      setSeoRows([]);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const seoItem = useMemo(() => (model ? findSeoMetadataForModel(seoRows, model) : null), [seoRows, model]);

  useEffect(() => {
    if (!model) return;
    const rawFuelTypes = Array.isArray(model.fuel_types) ? (model.fuel_types as unknown[]).map(String) : [];
    setModelForm({
      brandId: toStr(model.brand_id),
      name: toStr(model.name ?? model.model_name),
      slug: toStr(model.slug ?? model.model_slug),
      vehicleCategory: toStr(model.vehicle_category),
      bodyType: toStr(model.body_type),
      fuelTypesCsv: rawFuelTypes.join(", "),
      launchYear: toStr(model.launch_year),
      isDiscontinued: Boolean(model.is_discontinued),
      minPrice: toStr(model.min_price ?? model.starting_price),
      maxPrice: toStr(model.max_price),
      heroImageUrl: toStr(model.hero_image_url),
    });
  }, [model]);

  useEffect(() => {
    setMetaTitle(String(seoItem?.meta_title ?? ""));
    setMetaDescription(String(seoItem?.meta_description ?? ""));
    setOgTitle(String(seoItem?.og_title ?? ""));
    setOgDescription(String(seoItem?.og_description ?? ""));
    setCustomSlug(String(seoItem?.custom_slug ?? ""));
    setPriority(String(seoItem?.priority ?? "0.8"));
    setChangefreq(String(seoItem?.changefreq ?? "weekly"));
  }, [seoItem]);

  async function onSaveAll() {
    if (!model?.id) {
      toast.error("Model not available.");
      return;
    }

    const payload: Record<string, unknown> = {
      brand_id: modelForm.brandId.trim() || null,
      name: modelForm.name.trim(),
      slug: modelForm.slug.trim() || null,
      vehicle_category: modelForm.vehicleCategory.trim() || null,
      body_type: modelForm.bodyType.trim() || null,
      fuel_types: modelForm.fuelTypesCsv
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
      launch_year: modelForm.launchYear.trim() ? Number(modelForm.launchYear.trim()) : null,
      is_discontinued: modelForm.isDiscontinued,
      min_price: modelForm.minPrice.trim() ? Number(modelForm.minPrice.trim()) : null,
      max_price: modelForm.maxPrice.trim() ? Number(modelForm.maxPrice.trim()) : null,
      hero_image_url: modelForm.heroImageUrl.trim() || null,
    };

    setSaving(true);
    try {
      await patchCatalogueModelById(String(model.id), payload);
      await upsertSeoMetadata({
        id: seoItem?.id ?? undefined,
        entity_type: "model",
        entity_id: String(model.id),
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        og_title: ogTitle.trim() || null,
        og_description: ogDescription.trim() || null,
        custom_slug: customSlug.trim() || null,
        priority: priority.trim() ? Number(priority) : null,
        changefreq: changefreq.trim() || null,
      });
      toast.success("Model details updated.");
      await loadData();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update model.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const brandInfo = (model?.brand as Record<string, unknown> | undefined) ?? {};
  const modelImageUrl = toStr(model?.hero_image_url || model?.image_url || model?.thumbnail_url);
  const modelEntries = Object.entries(model ?? {});
  const seoEntries = Object.entries(seoItem ?? {});

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Model Details"
        subtitle="Complete catalogue and SEO info with full edit/update support."
        onRefresh={loadData}
      />

      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/models">Back to Models</Link>
        </Button>
        <div className="flex items-center gap-2">
          <DetailModeBadge mode={mode} />
          <Badge className="bg-purple-100 text-purple-800">Model ID: {modelId}</Badge>
        </div>
      </div>

      {loading ? (
        <AdminLoadingState label="Loading model details..." />
      ) : !model ? (
        <AdminEmptyState label="Model not found in catalogue list." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Model Summary</CardTitle>
              <CardDescription>Readable model details without raw JSON rows.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-purple-100 p-3 md:col-span-2">
                <p className="text-xs font-medium text-zinc-500">Model Image</p>
                {modelImageUrl ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-purple-100">
                    <Image src={modelImageUrl} alt="Model preview" width={1200} height={384} className="h-48 w-full object-cover" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-zinc-700">No image available.</p>
                )}
              </div>
              <div className="rounded-xl border border-purple-100 p-3">
                <p className="text-xs font-medium text-zinc-500">Model ID</p>
                <p className="mt-1 text-sm text-zinc-800">{toStr(model.id) || "-"}</p>
              </div>
              <div className="rounded-xl border border-purple-100 p-3">
                <p className="text-xs font-medium text-zinc-500">Last Scraped</p>
                <p className="mt-1 text-sm text-zinc-800">{toStr(model.last_scraped_at) || "-"}</p>
              </div>
              <div className="rounded-xl border border-purple-100 p-3">
                <p className="text-xs font-medium text-zinc-500">Created At</p>
                <p className="mt-1 text-sm text-zinc-800">{toStr(model.created_at) || "-"}</p>
              </div>
              <div className="rounded-xl border border-purple-100 p-3">
                <p className="text-xs font-medium text-zinc-500">Updated At</p>
                <p className="mt-1 text-sm text-zinc-800">{toStr(model.updated_at) || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>All Model Response Keys</CardTitle>
              <CardDescription>Complete payload from catalogue model list/detail response.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelEntries.map(([key, value]) => (
                      <tr key={key} className="border-t border-purple-100">
                        <td className="px-4 py-2 text-sm text-zinc-700">{key}</td>
                        <td className="px-4 py-2 text-sm text-zinc-700">
                          <AdminValueRenderer fieldKey={key} value={value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Edit Catalogue Details</CardTitle>
              <CardDescription>Structured editable fields for model update.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Brand ID</Label>
                <Input value={modelForm.brandId} onChange={(e) => setModelForm((prev) => ({ ...prev, brandId: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={modelForm.name} onChange={(e) => setModelForm((prev) => ({ ...prev, name: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={modelForm.slug} onChange={(e) => setModelForm((prev) => ({ ...prev, slug: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle Category</Label>
                <Input
                  value={modelForm.vehicleCategory}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, vehicleCategory: e.target.value }))}
                  disabled={isReadOnly(mode)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Body Type</Label>
                <Input value={modelForm.bodyType} onChange={(e) => setModelForm((prev) => ({ ...prev, bodyType: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fuel Types (comma separated)</Label>
                <Input
                  value={modelForm.fuelTypesCsv}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, fuelTypesCsv: e.target.value }))}
                  placeholder="petrol, cng"
                  disabled={isReadOnly(mode)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Launch Year</Label>
                <Input
                  type="number"
                  value={modelForm.launchYear}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, launchYear: e.target.value }))}
                  disabled={isReadOnly(mode)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min Price</Label>
                <Input type="number" value={modelForm.minPrice} onChange={(e) => setModelForm((prev) => ({ ...prev, minPrice: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Price</Label>
                <Input type="number" value={modelForm.maxPrice} onChange={(e) => setModelForm((prev) => ({ ...prev, maxPrice: e.target.value }))} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hero Image URL</Label>
                <Input
                  value={modelForm.heroImageUrl}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
                  disabled={isReadOnly(mode)}
                />
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={modelForm.isDiscontinued}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, isDiscontinued: e.target.checked }))}
                  disabled={isReadOnly(mode)}
                />
                Is Discontinued
              </label>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>Linked brand details from catalogue response.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(brandInfo).map(([key, value]) => (
                      <tr key={key} className="border-t border-purple-100">
                        <td className="px-4 py-2 text-sm text-zinc-700">{key}</td>
                        <td className="px-4 py-2 text-sm text-zinc-700">
                          <AdminValueRenderer fieldKey={key} value={value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
              <CardDescription>Linked metadata for this model from admin SEO API.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {seoEntries.length > 0 ? (
                <div className="md:col-span-2 overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seoEntries.map(([key, value]) => (
                        <tr key={key} className="border-t border-purple-100">
                          <td className="px-4 py-2 text-sm text-zinc-700">{key}</td>
                          <td className="px-4 py-2 text-sm text-zinc-700">
                            <AdminValueRenderer fieldKey={key} value={value} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <div className="space-y-1.5 md:col-span-2">
                <Label>Meta Title</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Meta Description</Label>
                <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>OG Title</Label>
                <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>OG Description</Label>
                <Input value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Custom Slug</Label>
                <Input value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Input type="number" min={0} max={1} step={0.1} value={priority} onChange={(e) => setPriority(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Changefreq</Label>
                <Input value={changefreq} onChange={(e) => setChangefreq(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Cars / Variants</CardTitle>
              <CardDescription>Variant records linked to this model.</CardDescription>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <AdminEmptyState label="No variants returned for this model (or slug mapping unavailable)." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-4 py-3">Variant</th>
                        <th className="px-4 py-3">Fuel</th>
                        <th className="px-4 py-3">Transmission</th>
                        <th className="px-4 py-3">Ex-showroom</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((item, idx) => {
                        const variantRef = String(item.slug ?? item.id ?? idx);
                        return (
                          <tr key={String(item.id ?? item.slug ?? idx)} className="border-t border-purple-100">
                            <td className="px-4 py-2 text-sm text-zinc-800">{String(item.variant_name ?? item.name ?? "-")}</td>
                            <td className="px-4 py-2 text-sm text-zinc-700">{String(item.fuel_type ?? "-")}</td>
                            <td className="px-4 py-2 text-sm text-zinc-700">{String(item.transmission_type ?? item.transmission ?? "-")}</td>
                            <td className="px-4 py-2 text-sm text-zinc-700">{String(item.ex_showroom_price ?? item.min_price ?? "-")}</td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button asChild variant="outline" size="sm" className="border-purple-200">
                                  <Link href={`/admin/models/${encodeURIComponent(modelId)}/variants/${encodeURIComponent(variantRef)}?mode=view`}>
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    View
                                  </Link>
                                </Button>
                                <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                  <Link href={`/admin/models/${encodeURIComponent(modelId)}/variants/${encodeURIComponent(variantRef)}?mode=edit`}>
                                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving || isReadOnly(mode)} onClick={() => void onSaveAll()}>
              {saving ? "Saving..." : "Save All Updates"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
