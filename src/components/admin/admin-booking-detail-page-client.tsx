"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { isReadOnly, readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/client/api-client";
import { listAdminBookings, type AdminBooking, updateAdminBooking } from "@/lib/client/admin-bookings-api";

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AdminBookingDetailPageClient({ bookingId }: { bookingId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [status, setStatus] = useState("");
  const [founderNotes, setFounderNotes] = useState("");

  const loadBooking = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminBookings();
      const selected = response.items.find((row) => String(row.id ?? "") === bookingId) ?? null;
      setBooking(selected);
      setStatus(String(selected?.status ?? ""));
      setFounderNotes(String(selected?.founder_notes ?? ""));
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load booking details.";
      toast.error(message);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const entries = useMemo(() => (booking ? Object.entries(booking) : []), [booking]);

  async function onSave() {
    if (!bookingId) return;
    setSaving(true);
    try {
      await updateAdminBooking(bookingId, {
        status: status.trim() || null,
        founder_notes: founderNotes.trim(),
      });
      toast.success("Booking updated.");
      await loadBooking();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update booking.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Booking Details" subtitle="Complete booking payload and editable admin fields." onRefresh={loadBooking} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/bookings">Back to Bookings</Link>
        </Button>
        <DetailModeBadge mode={mode} />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading booking details..." />
      ) : !booking ? (
        <AdminEmptyState label="Booking not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>All Booking Information</CardTitle>
              <CardDescription>Every field from booking list API.</CardDescription>
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
              <CardTitle>Edit Booking</CardTitle>
              <CardDescription>Edit booking status and founder notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="confirmed / cancelled / completed" disabled={isReadOnly(mode)} />
              </div>
              <div className="space-y-1.5">
                <Label>Founder Notes</Label>
                <Textarea rows={8} value={founderNotes} onChange={(e) => setFounderNotes(e.target.value)} disabled={isReadOnly(mode)} />
              </div>
              <div className="flex justify-end">
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving || isReadOnly(mode)} onClick={() => void onSave()}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Booking Update"
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
