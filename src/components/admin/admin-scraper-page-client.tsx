"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Play } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import {
  getScraperRunById,
  getScraperRunLogs,
  listScraperRuns,
  triggerManualScrapeRun,
  triggerScraperEnrich,
  type ScrapeLog,
  type ScrapeRun,
} from "@/lib/client/admin-scraper-api";

export function AdminScraperPageClient() {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const [enrichBrand, setEnrichBrand] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [runDetail, setRunDetail] = useState<Record<string, unknown> | null>(null);
  const [runLogs, setRunLogs] = useState<ScrapeLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [triggering, setTriggering] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const response = await listScraperRuns(page, limit);
      setRuns(response.items);
      setTotal(response.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load scrape runs.";
      toast.error(message);
      setRuns([]);
      setTotal(0);
    } finally {
      setLoadingRuns(false);
    }
  }, [limit, page]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  async function onTriggerManualRun() {
    setTriggering(true);
    try {
      await triggerManualScrapeRun();
      toast.success("Manual scrape run triggered.");
      await loadRuns();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to trigger scrape run.";
      toast.error(message);
    } finally {
      setTriggering(false);
    }
  }

  async function onTriggerEnrich() {
    if (!enrichBrand.trim()) {
      toast.error("Brand is required.");
      return;
    }
    setTriggering(true);
    try {
      await triggerScraperEnrich(enrichBrand.trim());
      toast.success("CardDekho enrichment triggered.");
      await loadRuns();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to trigger enrichment.";
      toast.error(message);
    } finally {
      setTriggering(false);
    }
  }

  async function onLoadRunDetails(runIdArg?: string) {
    const runId = runIdArg ?? selectedRunId;
    if (!runId.trim()) {
      toast.error("Run ID is required.");
      return;
    }
    setLoadingDetail(true);
    try {
      const [detail, logs] = await Promise.all([
        getScraperRunById(runId.trim()),
        getScraperRunLogs(runId.trim()),
      ]);
      setRunDetail(detail);
      setRunLogs(logs);
      setIsDetailOpen(true);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load run details/logs.";
      toast.error(message);
      setRunDetail(null);
      setRunLogs([]);
    } finally {
      setLoadingDetail(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const runOptions = runs
    .map((run) => {
      const id = String(run.id ?? "").trim();
      const brand = String(run.brand ?? "").trim();
      const status = String(run.status ?? "").trim();
      if (!id) return null;
      return { id, label: `${id}${brand ? ` - ${brand}` : ""}${status ? ` (${status})` : ""}` };
    })
    .filter((item): item is { id: string; label: string } => Boolean(item));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Scraper Management"
        subtitle="Trigger enrich/scrape, inspect runs, and view run logs."
        onRefresh={loadRuns}
      />
      <Card className="mb-4 border-purple-100 bg-white">
        <CardContent className="pt-6">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="scraper-limit">Runs per page</Label>
            <Input
              id="scraper-limit"
              type="number"
              min={1}
              value={String(limit)}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(parsed) && parsed > 0) {
                  setPage(1);
                  setLimit(parsed);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-purple-100 bg-white">
          <CardHeader>
            <CardTitle>Trigger Actions</CardTitle>
            <CardDescription>Manual run and CardDekho enrichment by brand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-purple-700 hover:bg-purple-800" disabled={triggering} onClick={() => void onTriggerManualRun()}>
              <Play className="mr-2 h-4 w-4" />
              Trigger Manual Scrape Run
            </Button>
            <div className="space-y-1.5">
              <Label htmlFor="enrich-brand">Brand for Enrichment</Label>
              <Input
                id="enrich-brand"
                value={enrichBrand}
                onChange={(e) => setEnrichBrand(e.target.value)}
                placeholder="tata / hyundai / mahindra"
              />
            </div>
            <Button variant="outline" className="w-full border-purple-200" disabled={triggering} onClick={() => void onTriggerEnrich()}>
              Trigger CardDekho Enrich
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-white">
          <CardHeader>
            <CardTitle>Run Detail & Logs</CardTitle>
            <CardDescription>Select a run and load its detail/logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="run-id">Run ID</Label>
              <select
                id="run-id"
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="h-10 w-full rounded-md border border-purple-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
              >
                <option value="">Select run</option>
                {runOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full bg-purple-700 hover:bg-purple-800" disabled={loadingDetail} onClick={() => void onLoadRunDetails()}>
              {loadingDetail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Run Detail & Logs"
              )}
            </Button>
            {runDetail ? <p className="text-xs text-zinc-600">Loaded run details. Opened in modal for structured view.</p> : null}
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Scrape Runs</CardTitle>
            <CardDescription>Total: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRuns ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-4 py-3">Run ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">Started</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run, idx) => (
                        <tr
                          key={String(run.id ?? idx)}
                          className="cursor-pointer border-t border-purple-100 hover:bg-purple-50"
                          onClick={() => setSelectedRunId(String(run.id ?? ""))}
                        >
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(run.id ?? "—")}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(run.status ?? "—")}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(run.brand ?? "—")}</td>
                          <td className="px-4 py-3 text-xs text-zinc-700">{String(run.started_at ?? run.created_at ?? "—")}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-200"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const id = String(run.id ?? "");
                                  setSelectedRunId(id);
                                  void onLoadRunDetails(id);
                                }}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Button>
                              <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                <Link
                                  href={`/admin/scraper/runs/${encodeURIComponent(String(run.id ?? ""))}?mode=edit`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                  }}
                                >
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Scrape Run Detail</DialogTitle>
            <DialogDescription>Run metadata and logs</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Run Detail</p>
              <div className="max-h-[55vh] overflow-auto rounded-lg border border-purple-100 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(runDetail ?? {}).map(([key, value]) => (
                      <tr key={key} className="border-t border-purple-100">
                        <td className="px-3 py-2 text-xs text-zinc-700">{key}</td>
                        <td className="px-3 py-2 text-xs text-zinc-700">
                          <AdminValueRenderer fieldKey={key} value={value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Run Logs</p>
              <div className="max-h-[55vh] overflow-auto rounded-lg border border-purple-100 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                    <tr>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runLogs.map((log, idx) => (
                      <tr key={idx} className="border-t border-purple-100">
                        <td className="px-3 py-2 text-xs text-zinc-700">{String(log.timestamp ?? log.created_at ?? "—")}</td>
                        <td className="px-3 py-2 text-xs text-zinc-700">{String(log.level ?? "—")}</td>
                        <td className="px-3 py-2 text-xs text-zinc-700">{String(log.message ?? JSON.stringify(log))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
