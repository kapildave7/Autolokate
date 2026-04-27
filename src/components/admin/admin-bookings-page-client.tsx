"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/client/api-client";
import { listAdminBookingsWithParams, updateAdminBooking, type AdminBooking } from "@/lib/client/admin-bookings-api";

const PAGE_SIZE = 10;

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

export function AdminBookingsPageClient() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [founderNotes, setFounderNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminBookingsWithParams({ page, limit: PAGE_SIZE });
      setAllItems(response.items);
      setTotal(response.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load bookings.";
      toast.error(message);
      setAllItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredItems = useMemo(() => {
    const next = allItems.filter((item) => {
      const status = String(item.status ?? "").toLowerCase();
      const name = String(item.full_name ?? item.user_name ?? item.name ?? "").toLowerCase();
      const phone = String(item.phone ?? "").toLowerCase();
      const q = debouncedSearch.trim().toLowerCase();
      const statusOk = statusFilter === "all" ? true : status === statusFilter.toLowerCase();
      const searchOk = !q ? true : name.includes(q) || phone.includes(q) || String(item.id ?? "").toLowerCase().includes(q);
      return statusOk && searchOk;
    });
    return next;
  }, [allItems, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedItems = filteredItems;

  const selectedBooking = useMemo(
    () => allItems.find((item) => String(item.id ?? "") === selectedBookingId) ?? null,
    [allItems, selectedBookingId]
  );
  const bookingOptions = useMemo(
    () =>
      allItems
        .map((item) => {
          const id = String(item.id ?? "").trim();
          const label = String(item.full_name ?? item.user_name ?? item.name ?? "Unnamed User").trim();
          const phone = String(item.phone ?? "").trim();
          if (!id) return null;
          return { id, label: phone ? `${label} (${phone})` : label };
        })
        .filter((item): item is { id: string; label: string } => Boolean(item)),
    [allItems]
  );

  useEffect(() => {
    if (!selectedBooking) return;
    setSelectedStatus(String(selectedBooking.status ?? ""));
    setFounderNotes(String(selectedBooking.founder_notes ?? ""));
  }, [selectedBooking]);

  async function onSave() {
    if (!selectedBookingId) {
      toast.error("Select a booking first.");
      return;
    }
    const payload: Record<string, unknown> = {};
    if (selectedStatus.trim()) payload.status = selectedStatus.trim();
    payload.founder_notes = founderNotes.trim();

    setSaving(true);
    try {
      await updateAdminBooking(selectedBookingId, payload);
      toast.success("Booking updated successfully.");
      await loadBookings();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update booking.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Bookings Management"
        subtitle="List bookings and update status/founder notes."
        onRefresh={loadBookings}
      />

      {loading ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>Total: {total}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, id..." />
                <Input value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="Filter status (or all)" />
              </div>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item, idx) => {
                      const id = String(item.id ?? idx);
                      const selected = id === selectedBookingId;
                      return (
                        <tr
                          key={id}
                          className={`cursor-pointer border-t border-purple-100 ${selected ? "bg-purple-50" : "bg-white hover:bg-purple-50"}`}
                          onClick={() => setSelectedBookingId(id)}
                        >
                          <td className="px-4 py-3 text-xs text-zinc-700">{id}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(item.full_name ?? item.user_name ?? item.name ?? "—")}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(item.status ?? "—")}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="sm" className="border-purple-200">
                                <Link href={`/admin/bookings/${encodeURIComponent(id)}?mode=view`}>
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </Link>
                              </Button>
                              <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                <Link href={`/admin/bookings/${encodeURIComponent(id)}?mode=edit`}>
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
              <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Update Booking</CardTitle>
              <CardDescription>Select a booking and update status/notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Booking ID</Label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="h-10 w-full rounded-md border border-purple-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
                >
                  <option value="">Select booking by user name</option>
                  {bookingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Input value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} placeholder="confirmed / cancelled / completed" />
              </div>
              <div className="space-y-1.5">
                <Label>Founder Notes</Label>
                <Textarea rows={8} value={founderNotes} onChange={(e) => setFounderNotes(e.target.value)} placeholder="Write founder notes..." />
              </div>
              <Button className="w-full bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onSave()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Booking Update"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
