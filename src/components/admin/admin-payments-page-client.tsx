"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { listAdminPaymentsWithParams, refundAdminPayment, type PaymentItem } from "@/lib/client/admin-payments-api";

const PAGE_SIZE = 20;

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPaymentsPageClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [refundId, setRefundId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmountPaise, setRefundAmountPaise] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminPaymentsWithParams({ page, limit: PAGE_SIZE });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load payments.";
      toast.error(message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paymentOptions = items
    .map((item) => {
      const id = String(item.id ?? "").trim();
      const kind = String(item.payment_type ?? item.type ?? "payment").trim();
      const amount =
        typeof item.amount_paise === "number"
          ? `INR ${(item.amount_paise as number) / 100}`
          : String(item.amount ?? "").trim();
      if (!id) return null;
      return { id, label: amount ? `${kind} - ${amount}` : kind };
    })
    .filter((item): item is { id: string; label: string } => Boolean(item));

  async function onRefund() {
    try {
      if (!refundId.trim()) throw new Error("Payment ID is required.");
      const payload: Record<string, unknown> = {};
      if (refundReason.trim()) payload.reason = refundReason.trim();
      if (refundAmountPaise.trim()) payload.amount_paise = Number(refundAmountPaise);
      await refundAdminPayment(refundId.trim(), payload);
      toast.success("Refund issued successfully.");
      await loadPayments();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to issue refund.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Payments Management" subtitle="List payments and issue refunds." onRefresh={loadPayments} />

      {loading ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Issue Refund</CardTitle>
              <CardDescription>Select a payment and submit refund details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="refund-id">Payment ID</Label>
                <select
                  id="refund-id"
                  value={refundId}
                  onChange={(e) => setRefundId(e.target.value)}
                  className="h-10 w-full rounded-md border border-purple-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
                >
                  <option value="">Select payment</option>
                  {paymentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="refund-reason">Reason (optional)</Label>
                  <Input
                    id="refund-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Customer request"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refund-amount">Refund Amount (paise, optional)</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    value={refundAmountPaise}
                    onChange={(e) => setRefundAmountPaise(e.target.value)}
                    placeholder="49900"
                  />
                </div>
              </div>
              <Button className="w-full bg-purple-700 hover:bg-purple-800" onClick={() => void onRefund()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Issue Refund
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white lg:col-span-2">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Total: {total} • Page {page} of {totalPages}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={String(item.id ?? idx)} className="border-t border-purple-100">
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.id ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.payment_type ?? item.type ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">
                          {typeof item.amount_paise === "number" ? `INR ${(item.amount_paise as number) / 100}` : String(item.amount ?? "—")}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.status ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="border-purple-200">
                              <Link href={`/admin/payments/${encodeURIComponent(String(item.id ?? ""))}?mode=view`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                              <Link href={`/admin/payments/${encodeURIComponent(String(item.id ?? ""))}?mode=edit`}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  Showing page {page} ({items.length} rows)
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
