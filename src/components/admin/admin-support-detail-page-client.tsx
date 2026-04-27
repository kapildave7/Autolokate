"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/client/api-client";
import { listAdminGrievances, type AdminGrievance } from "@/lib/client/admin-support-api";

export function AdminSupportDetailPageClient({ grievanceId }: { grievanceId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<AdminGrievance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAdminGrievances();
      const selected = response.items.find((row) => String(row.id ?? "") === grievanceId) ?? null;
      setItem(selected);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load grievance details.";
      toast.error(message);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [grievanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => (item ? Object.entries(item) : []), [item]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Support Detail" subtitle="Complete grievance details view." onRefresh={load} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/support">Back to Support</Link>
        </Button>
        <DetailModeBadge mode={mode} readOnlyLabel="View Mode (read-only API)" />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading grievance details..." />
      ) : !item ? (
        <AdminEmptyState label="Grievance not found." />
      ) : (
        <Card className="border-purple-100 bg-white">
          <CardHeader>
            <CardTitle>Grievance Information</CardTitle>
            <CardDescription>All fields from support API response.</CardDescription>
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
      )}
    </div>
  );
}
