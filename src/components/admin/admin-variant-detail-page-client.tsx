"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
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
import { createPipelineFieldOverride } from "@/lib/client/admin-pipeline-api";
import { getModels, getModelVariants, getVariantDetails, getVariantPrice } from "@/lib/client/catalogue-api";

type Props = { modelId: string; variantRef: string };
type Dict = Record<string, unknown>;

function resolveVariantRef(item: Dict, idx: number): string {
  return String(item.slug ?? item.id ?? idx);
}

export function AdminVariantDetailPageClient({ modelId, variantRef }: Props) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [savingOverride, setSavingOverride] = useState(false);
  const [model, setModel] = useState<Dict | null>(null);
  const [variant, setVariant] = useState<Dict | null>(null);
  const [variantPrice, setVariantPrice] = useState<Dict | null>(null);

  const [overrideField, setOverrideField] = useState("");
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideSource, setOverrideSource] = useState("catalogue");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allModels = (await getModels()) as Dict[];
      const selectedModel = allModels.find((item) => String(item.id ?? "") === modelId) ?? null;
      setModel(selectedModel);
      if (!selectedModel) {
        setVariant(null);
        setVariantPrice(null);
        return;
      }
      const brandSlug = String(selectedModel.brand_slug ?? "");
      const modelSlug = String(selectedModel.slug ?? selectedModel.model_slug ?? "");
      if (!brandSlug || !modelSlug) {
        setVariant(null);
        setVariantPrice(null);
        return;
      }
      const list = (await getModelVariants(brandSlug, modelSlug)) as Dict[];
      const selectedFromList = list.find((item, idx) => resolveVariantRef(item, idx) === variantRef) ?? null;
      let detail = selectedFromList;
      if (selectedFromList?.slug) {
        detail = (await getVariantDetails(brandSlug, modelSlug, String(selectedFromList.slug))) as Dict;
        const price = (await getVariantPrice(brandSlug, modelSlug, String(selectedFromList.slug), "all")) as Dict;
        setVariantPrice(price);
      } else {
        setVariantPrice(null);
      }
      setVariant(detail);
      setOverrideField(String(detail?.field ?? ""));
      setOverrideValue("");
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load car/variant details.";
      toast.error(message);
      setVariant(null);
      setVariantPrice(null);
    } finally {
      setLoading(false);
    }
  }, [modelId, variantRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => Object.entries(variant ?? {}), [variant]);
  const priceEntries = useMemo(() => Object.entries(variantPrice ?? {}), [variantPrice]);
  const imageUrls = useMemo(() => {
    const raw = [
      variant?.image_url,
      variant?.hero_image_url,
      variant?.thumbnail_url,
      variant?.og_image_url,
      ...(Array.isArray(variant?.images) ? (variant?.images as unknown[]) : []),
      ...(Array.isArray(variant?.gallery_images) ? (variant?.gallery_images as unknown[]) : []),
    ];
    const urls = raw
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.startsWith("http"));
    return Array.from(new Set(urls));
  }, [variant]);

  async function onCreateOverride() {
    if (!variant) return;
    if (!overrideField.trim() || !overrideValue.trim()) {
      toast.error("Field and value are required for override.");
      return;
    }
    setSavingOverride(true);
    try {
      await createPipelineFieldOverride({
        source: overrideSource.trim() || "catalogue",
        field: overrideField.trim(),
        value: overrideValue.trim(),
      });
      toast.success("Field override created. Pipeline will use override during processing.");
      setOverrideValue("");
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to create field override.";
      toast.error(message);
    } finally {
      setSavingOverride(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Car / Variant Detail" subtitle="Complete variant payload from catalogue APIs." onRefresh={load} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href={`/admin/models/${encodeURIComponent(modelId)}`}>Back to Model</Link>
        </Button>
        <div className="flex items-center gap-2">
          <DetailModeBadge mode={mode} />
          <Badge className="bg-purple-100 text-purple-800">Variant Ref: {variantRef}</Badge>
        </div>
      </div>

      {loading ? (
        <AdminLoadingState label="Loading car/variant details..." />
      ) : !model || !variant ? (
        <AdminEmptyState label="Variant not found for this model." />
      ) : (
        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50 text-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Direct car update limitation
              </CardTitle>
              <CardDescription className="text-amber-900/90">
                Swagger currently has no admin endpoint to patch a variant directly. You can review all keys below and use field overrides in edit mode.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
              <CardDescription>Car images visible for quick inspection.</CardDescription>
            </CardHeader>
            <CardContent>
              {imageUrls.length === 0 ? (
                <AdminEmptyState label="No image URLs found in variant payload." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imageUrls.map((url) => (
                    <div key={url} className="overflow-hidden rounded-lg border border-purple-100 bg-white">
                      <Image src={url} alt="Variant preview" width={640} height={320} className="h-40 w-full object-cover" />
                      <p className="line-clamp-2 px-2 py-1 text-xs text-zinc-600">{url}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Variant Information</CardTitle>
              <CardDescription>Every key returned by variant detail/list APIs.</CardDescription>
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
                    {entries.map(([key, value]) => (
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
              <CardTitle>Variant Price Payload</CardTitle>
              <CardDescription>{"Response from `/variants/{slug}/price` when slug is available."}</CardDescription>
            </CardHeader>
            <CardContent>
              {priceEntries.length === 0 ? (
                <AdminEmptyState label="Price payload not available for this variant reference." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceEntries.map(([key, value]) => (
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
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Operational Edit (Field Override)</CardTitle>
              <CardDescription>Create a pipeline field override for unsupported direct variant updates.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input value={overrideSource} onChange={(e) => setOverrideSource(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Field</Label>
                <Input value={overrideField} onChange={(e) => setOverrideField(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Value</Label>
                <Textarea rows={4} value={overrideValue} onChange={(e) => setOverrideValue(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={savingOverride || isReadOnly(mode)} onClick={() => void onCreateOverride()}>
                  {savingOverride ? "Saving..." : "Create Override"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
