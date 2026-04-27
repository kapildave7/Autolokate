"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { isReadOnly, readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import { listAdminPayments, type PaymentItem, refundAdminPayment } from "@/lib/client/admin-payments-api";

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AdminPaymentDetailPageClient({ paymentId }: { paymentId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmountPaise, setRefundAmountPaise] = useState("");

  const loadPayment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminPayments();
      const selected = response.items.find((row) => String(row.id ?? "") === paymentId) ?? null;
      setPayment(selected);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load payment details.";
      toast.error(message);
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  const entries = useMemo(() => (payment ? Object.entries(payment) : []), [payment]);

  async function onRefund() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (refundReason.trim()) body.reason = refundReason.trim();
      if (refundAmountPaise.trim()) body.amount_paise = Number(refundAmountPaise);
      await refundAdminPayment(paymentId, body);
      toast.success("Refund issued successfully.");
      setRefundReason("");
      setRefundAmountPaise("");
      await loadPayment();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to issue refund.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Payment Details" subtitle="Complete payment payload and refund actions." onRefresh={loadPayment} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/payments">Back to Payments</Link>
        </Button>
        <DetailModeBadge mode={mode} />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading payment details..." />
      ) : !payment ? (
        <AdminEmptyState label="Payment not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>All Payment Information</CardTitle>
              <CardDescription>Every field from payments API.</CardDescription>
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
                        <td className="px-4 py-2 text-sm font-medium text-zinc-700">{key}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">
                          <pre className="whitespace-pre-wrap wrap-break-word">{pretty(value)}</pre>
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
              <CardTitle>Issue Refund</CardTitle>
              <CardDescription>Provide refund details and submit.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Reason</Label>
                <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Customer request" disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (paise)</Label>
                <Input type="number" value={refundAmountPaise} onChange={(e) => setRefundAmountPaise(e.target.value)} placeholder="49900" disabled={isReadOnly(mode)} />
              </div>
              <div className="flex items-end justify-end">
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={submitting || isReadOnly(mode)} onClick={() => void onRefund()}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Issue Refund
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
