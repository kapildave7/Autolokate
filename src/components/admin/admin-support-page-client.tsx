"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/client/api-client";
import { listAdminGrievances, type AdminGrievance } from "@/lib/client/admin-support-api";

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

export function AdminSupportPageClient() {
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<AdminGrievance[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminGrievances();
      setAllItems(Array.isArray(response.items) ? response.items : []);
      setTotal(response.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load grievances.";
      toast.error(message);
      setAllItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrievances();
  }, [loadGrievances]);

  const filteredItems = useMemo(() => {
    const sourceItems = Array.isArray(allItems) ? allItems : [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return sourceItems;
    return sourceItems.filter((item) => {
      const id = String(item.id ?? "").toLowerCase();
      const subject = String(item.subject ?? item.title ?? "").toLowerCase();
      const status = String(item.status ?? "").toLowerCase();
      const user = String(item.full_name ?? item.user_name ?? "").toLowerCase();
      return id.includes(q) || subject.includes(q) || status.includes(q) || user.includes(q);
    });
  }, [allItems, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Support Grievances" subtitle="List and monitor all support grievances." onRefresh={loadGrievances} />

      <Card className="border-purple-100 bg-white">
        <CardHeader className="space-y-3">
          <CardTitle>Grievances</CardTitle>
          <CardDescription>Total: {total}</CardDescription>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by id, subject, status, user..."
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((item, idx) => (
                      <tr key={String(item.id ?? idx)} className="border-t border-purple-100">
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.id ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.subject ?? item.title ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.status ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{String(item.full_name ?? item.user_name ?? "—")}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="border-purple-200">
                              <Link href={`/admin/support/${encodeURIComponent(String(item.id ?? ""))}?mode=view`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                              <Link href={`/admin/support/${encodeURIComponent(String(item.id ?? ""))}?mode=edit`}>
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
