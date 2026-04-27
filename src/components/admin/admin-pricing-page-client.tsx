"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import {
  createPricingConfig,
  deactivatePricingConfig,
  listPricingConfigs,
  updatePricingConfig,
  type PricingItem,
} from "@/lib/client/admin-pricing-api";

export function AdminPricingPageClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PricingItem[]>([]);
  const [total, setTotal] = useState(0);

  const [createName, setCreateName] = useState("");
  const [createPaymentType, setCreatePaymentType] = useState("");
  const [createAmountPaise, setCreateAmountPaise] = useState("");
  const [createCurrency, setCreateCurrency] = useState("INR");
  const [updateId, setUpdateId] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [updatePaymentType, setUpdatePaymentType] = useState("");
  const [updateAmountPaise, setUpdateAmountPaise] = useState("");
  const [updateCurrency, setUpdateCurrency] = useState("INR");

  const loadPricing = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPricingConfigs();
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load pricing configs.";
      toast.error(message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  async function handleAction(action: () => Promise<void>, successMessage: string) {
    try {
      await action();
      toast.success(successMessage);
      await loadPricing();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Request failed.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Pricing Management"
        subtitle="List, create, update, and deactivate pricing configs."
        onRefresh={loadPricing}
      />

      {loading ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Create Pricing Config</CardTitle>
              <CardDescription>Create a new pricing configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="create-pricing-name">Name</Label>
                  <Input id="create-pricing-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="default-plan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-pricing-type">Payment Type</Label>
                  <Input
                    id="create-pricing-type"
                    value={createPaymentType}
                    onChange={(e) => setCreatePaymentType(e.target.value)}
                    placeholder="booking"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-pricing-amount">Amount (paise)</Label>
                  <Input
                    id="create-pricing-amount"
                    type="number"
                    value={createAmountPaise}
                    onChange={(e) => setCreateAmountPaise(e.target.value)}
                    placeholder="49900"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-pricing-currency">Currency</Label>
                  <Input
                    id="create-pricing-currency"
                    value={createCurrency}
                    onChange={(e) => setCreateCurrency(e.target.value.toUpperCase())}
                    placeholder="INR"
                  />
                </div>
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-800"
                onClick={() =>
                  void handleAction(async () => {
                    if (!createName.trim() || !createPaymentType.trim() || !createAmountPaise.trim()) {
                      throw new Error("Name, payment type, and amount are required.");
                    }
                    await createPricingConfig({
                      name: createName.trim(),
                      payment_type: createPaymentType.trim(),
                      amount_paise: Number(createAmountPaise),
                      currency: createCurrency.trim().toUpperCase() || "INR",
                    });
                    setCreateName("");
                    setCreatePaymentType("");
                    setCreateAmountPaise("");
                    setCreateCurrency("INR");
                  }, "Pricing config created.")
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Config
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Update Pricing Config</CardTitle>
              <CardDescription>Update an existing pricing configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pricing-update-id">Pricing ID</Label>
                <Input id="pricing-update-id" value={updateId} onChange={(e) => setUpdateId(e.target.value)} placeholder="pricing_config_id" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="update-pricing-name">Name (optional)</Label>
                  <Input id="update-pricing-name" value={updateName} onChange={(e) => setUpdateName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-pricing-type">Payment Type (optional)</Label>
                  <Input id="update-pricing-type" value={updatePaymentType} onChange={(e) => setUpdatePaymentType(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-pricing-amount">Amount (paise, optional)</Label>
                  <Input
                    id="update-pricing-amount"
                    type="number"
                    value={updateAmountPaise}
                    onChange={(e) => setUpdateAmountPaise(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-pricing-currency">Currency (optional)</Label>
                  <Input id="update-pricing-currency" value={updateCurrency} onChange={(e) => setUpdateCurrency(e.target.value.toUpperCase())} />
                </div>
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-800"
                onClick={() =>
                  void handleAction(async () => {
                    if (!updateId.trim()) throw new Error("Pricing ID is required.");
                    const payload: Record<string, unknown> = {};
                    if (updateName.trim()) payload.name = updateName.trim();
                    if (updatePaymentType.trim()) payload.payment_type = updatePaymentType.trim();
                    if (updateAmountPaise.trim()) payload.amount_paise = Number(updateAmountPaise);
                    if (updateCurrency.trim()) payload.currency = updateCurrency.trim().toUpperCase();
                    if (!Object.keys(payload).length) throw new Error("Add at least one field to update.");
                    await updatePricingConfig(updateId.trim(), payload);
                  }, "Pricing config updated.")
                }
              >
                Update Config
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Pricing Configs</CardTitle>
              <CardDescription>Total: {total}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Currency</th>
                      <th className="px-4 py-3">Active</th>
                      <th className="px-4 py-3">Actions</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={String(item.id ?? idx)} className="border-t border-purple-100">
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.name ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.payment_type ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">
                          {typeof item.amount_paise === "number" ? `INR ${(item.amount_paise as number) / 100}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.currency ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{item.is_active ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm" className="border-purple-200">
                              <Link href={`/admin/pricing/${encodeURIComponent(String(item.id ?? ""))}?mode=view`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                              <Link href={`/admin/pricing/${encodeURIComponent(String(item.id ?? ""))}?mode=edit`}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                void handleAction(() => deactivatePricingConfig(String(item.id)), "Pricing config deactivated.")
                              }
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Deactivate
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
