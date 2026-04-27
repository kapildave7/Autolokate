"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { isReadOnly, readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { deactivatePricingConfig, listPricingConfigs, type PricingItem, updatePricingConfig } from "@/lib/client/admin-pricing-api";

export function AdminPricingDetailPageClient({ pricingId }: { pricingId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<PricingItem | null>(null);
  const [name, setName] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [amountPaise, setAmountPaise] = useState("");
  const [currency, setCurrency] = useState("INR");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPricingConfigs();
      const selected = response.items.find((row) => String(row.id ?? "") === pricingId) ?? null;
      setItem(selected);
      setName(String(selected?.name ?? ""));
      setPaymentType(String(selected?.payment_type ?? ""));
      setAmountPaise(String(selected?.amount_paise ?? ""));
      setCurrency(String(selected?.currency ?? "INR"));
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load pricing details.";
      toast.error(message);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [pricingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => (item ? Object.entries(item) : []), [item]);

  async function onSave() {
    if (!item?.id) return;
    setSaving(true);
    try {
      await updatePricingConfig(item.id, {
        name: name.trim() || null,
        payment_type: paymentType.trim() || null,
        amount_paise: amountPaise.trim() ? Number(amountPaise) : null,
        currency: currency.trim().toUpperCase() || null,
      });
      toast.success("Pricing updated.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update pricing.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate() {
    if (!item?.id) return;
    try {
      await deactivatePricingConfig(item.id);
      toast.success("Pricing deactivated.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to deactivate pricing.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Pricing Detail" subtitle="Complete pricing config detail and update actions." onRefresh={load} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/pricing">Back to Pricing</Link>
        </Button>
        <DetailModeBadge mode={mode} />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading pricing details..." />
      ) : !item ? (
        <AdminEmptyState label="Pricing config not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
              <CardDescription>All fields from pricing API.</CardDescription>
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
              <CardTitle>Edit Pricing</CardTitle>
              <CardDescription>Update pricing fields for this config.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Input value={paymentType} onChange={(e) => setPaymentType(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (paise)</Label>
                <Input type="number" value={amountPaise} onChange={(e) => setAmountPaise(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} disabled={isReadOnly(mode)} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="destructive" onClick={() => void onDeactivate()} disabled={isReadOnly(mode)}>
                  Deactivate
                </Button>
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving || isReadOnly(mode)} onClick={() => void onSave()}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
