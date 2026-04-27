"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/client/api-client";
import { getScraperRunById, getScraperRunLogs, type ScrapeLog } from "@/lib/client/admin-scraper-api";

export function AdminScraperRunDetailPageClient({ runId }: { runId: string }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<ScrapeLog[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [runDetail, runLogs] = await Promise.all([getScraperRunById(runId), getScraperRunLogs(runId)]);
      setDetail(runDetail);
      setLogs(runLogs);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load run details.";
      toast.error(message);
      setDetail(null);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => Object.entries(detail ?? {}), [detail]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Scrape Run Detail" subtitle="Run metadata and logs in structured view." onRefresh={load} />
      <div className="mb-4">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/scraper">Back to Scraper</Link>
        </Button>
      </div>
      {loading ? (
        <AdminLoadingState label="Loading run details..." />
      ) : !detail ? (
        <AdminEmptyState label="Scrape run not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Run Information</CardTitle>
              <CardDescription>All fields returned by run detail API.</CardDescription>
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
              <CardTitle>Run Logs</CardTitle>
              <CardDescription>Logs for this run.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-purple-100">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Level</th>
                      <th className="px-4 py-3">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={idx} className="border-t border-purple-100">
                        <td className="px-4 py-2 text-xs text-zinc-700">{String(log.timestamp ?? log.created_at ?? "—")}</td>
                        <td className="px-4 py-2 text-xs text-zinc-700">{String(log.level ?? "—")}</td>
                        <td className="px-4 py-2 text-xs text-zinc-700">{String(log.message ?? "—")}</td>
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
