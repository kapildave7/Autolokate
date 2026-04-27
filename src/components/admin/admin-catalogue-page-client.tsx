"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bulkImportCatalogueModels, patchCatalogueModelById } from "@/lib/client/admin-catalogue-api";
import { ApiError } from "@/lib/client/api-client";
import { getModels } from "@/lib/client/catalogue-api";

type ImportRow = { name: string; brand: string; fuel_type: string };

export function AdminCataloguePageClient() {
  const [importFormat, setImportFormat] = useState("json");
  const [importRows, setImportRows] = useState<ImportRow[]>([{ name: "", brand: "", fuel_type: "" }]);
  const [modelId, setModelId] = useState("");
  const [patchName, setPatchName] = useState("");
  const [patchBrand, setPatchBrand] = useState("");
  const [patchFuelType, setPatchFuelType] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [catalogueModels, setCatalogueModels] = useState<Record<string, unknown>[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    async function loadModels() {
      setLoadingModels(true);
      try {
        const rows = await getModels();
        setCatalogueModels(rows as Record<string, unknown>[]);
      } catch {
        setCatalogueModels([]);
      } finally {
        setLoadingModels(false);
      }
    }
    void loadModels();
  }, []);

  const modelOptions = useMemo(
    () =>
      catalogueModels
        .map((row) => {
          const id = String(row.id ?? "").trim();
          const name = String(row.model_name ?? row.name ?? "Unnamed Model").trim();
          const brand = String(row.brand_name ?? "").trim();
          if (!id) return null;
          return { id, label: brand ? `${name} (${brand})` : name };
        })
        .filter((item): item is { id: string; label: string } => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [catalogueModels]
  );

  async function onImport() {
    setIsImporting(true);
    try {
      const rows = importRows
        .map((row) => ({
          name: row.name.trim(),
          brand: row.brand.trim(),
          fuel_type: row.fuel_type.trim(),
        }))
        .filter((row) => row.name && row.brand);
      if (!rows.length) {
        throw new Error("Add at least one valid row with name and brand.");
      }
      await bulkImportCatalogueModels({
        format: importFormat.trim() || "json",
        data: rows,
      });
      toast.success("Catalogue import request submitted.");
      setImportRows([{ name: "", brand: "", fuel_type: "" }]);
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Failed to import catalogue models.";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  async function onPatchModel() {
    if (!modelId.trim()) {
      toast.error("Please enter model ID.");
      return;
    }
    setIsPatching(true);
    try {
      const payload: Record<string, unknown> = {};
      if (patchName.trim()) payload.name = patchName.trim();
      if (patchBrand.trim()) payload.brand = patchBrand.trim();
      if (patchFuelType.trim()) payload.fuel_type = patchFuelType.trim();
      if (!Object.keys(payload).length) throw new Error("Add at least one field to patch.");
      await patchCatalogueModelById(modelId.trim(), payload);
      toast.success("Model updated successfully.");
      setPatchName("");
      setPatchBrand("");
      setPatchFuelType("");
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "Failed to patch model.";
      toast.error(message);
    } finally {
      setIsPatching(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Admin Catalogue"
        subtitle="Bulk import models and patch model details by ID."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-purple-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Bulk Import Models</CardTitle>
            <CardDescription>Upload structured rows for bulk model import.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="import-format">Format</Label>
              <Input id="import-format" value={importFormat} onChange={(event) => setImportFormat(event.target.value)} />
            </div>
            {importRows.map((row, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-purple-100 p-3 sm:grid-cols-3">
                <Input
                  value={row.name}
                  onChange={(event) =>
                    setImportRows((prev) => prev.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
                  }
                  placeholder="Model name"
                />
                <Input
                  value={row.brand}
                  onChange={(event) =>
                    setImportRows((prev) => prev.map((item, i) => (i === index ? { ...item, brand: event.target.value } : item)))
                  }
                  placeholder="Brand"
                />
                <Input
                  value={row.fuel_type}
                  onChange={(event) =>
                    setImportRows((prev) => prev.map((item, i) => (i === index ? { ...item, fuel_type: event.target.value } : item)))
                  }
                  placeholder="Fuel type"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-purple-200"
                onClick={() => setImportRows((prev) => [...prev, { name: "", brand: "", fuel_type: "" }])}
              >
                Add Row
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-purple-200"
                onClick={() => setImportRows((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
              >
                Remove Last
              </Button>
            </div>
            <Button
              className="w-full bg-purple-700 hover:bg-purple-800"
              disabled={isImporting}
              onClick={() => void onImport()}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Run Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Patch Model By ID</CardTitle>
            <CardDescription>Update selected model with partial fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-model-id">Model ID</Label>
              <select
                id="catalogue-model-id"
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
                className="h-10 w-full rounded-md border border-purple-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
              >
                <option value="">
                  {loadingModels ? "Loading models..." : "Select model by name (auto-uses model UUID)"}
                </option>
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {modelId.trim() ? (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="border-purple-200">
                  <Link href={`/admin/models/${encodeURIComponent(modelId.trim())}?mode=view`}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                  <Link href={`/admin/models/${encodeURIComponent(modelId.trim())}?mode=edit`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="patch-name">Name (optional)</Label>
              <Input id="patch-name" value={patchName} onChange={(event) => setPatchName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patch-brand">Brand (optional)</Label>
              <Input id="patch-brand" value={patchBrand} onChange={(event) => setPatchBrand(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patch-fuel-type">Fuel Type (optional)</Label>
              <Input id="patch-fuel-type" value={patchFuelType} onChange={(event) => setPatchFuelType(event.target.value)} />
            </div>
            <Button
              className="w-full bg-purple-700 hover:bg-purple-800"
              disabled={isPatching}
              onClick={() => void onPatchModel()}
            >
              {isPatching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Patch Model"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
