"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/client/api-client";
import {
  acknowledgePipelineAnomaly,
  createPipelineFieldOverride,
  deletePipelineFieldOverride,
  getPipelineCoverage,
  getPipelineHealth,
  listPipelineAnomalies,
  listPipelineCoverageGaps,
  listPipelineFieldOverrides,
  listPipelineFreshness,
  listPipelineKillSwitches,
  listPipelineRejected,
  listPipelineRevisions,
  rollbackPipelineRevision,
  togglePipelineKillSwitch,
  updatePipelineFieldOverride,
  type PipelineItem,
} from "@/lib/client/admin-pipeline-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PipelineTab =
  | "health"
  | "coverage"
  | "revisions"
  | "rejected"
  | "freshness"
  | "anomalies"
  | "kill-switches"
  | "field-overrides";
export function AdminPipelinePageClient() {
  const [activeTab, setActiveTab] = useState<PipelineTab>("health");
  const [loading, setLoading] = useState(true);

  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [coverage, setCoverage] = useState<Record<string, unknown> | null>(null);
  const [coverageItems, setCoverageItems] = useState<PipelineItem[]>([]);
  const [coverageGaps, setCoverageGaps] = useState<PipelineItem[]>([]);
  const [revisions, setRevisions] = useState<PipelineItem[]>([]);
  const [rejected, setRejected] = useState<PipelineItem[]>([]);
  const [freshness, setFreshness] = useState<PipelineItem[]>([]);
  const [anomalies, setAnomalies] = useState<PipelineItem[]>([]);
  const [killSwitches, setKillSwitches] = useState<PipelineItem[]>([]);
  const [fieldOverrides, setFieldOverrides] = useState<PipelineItem[]>([]);
  const [listLimit, setListLimit] = useState("20");
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState("");
  const [anomalyAcknowledgedFilter, setAnomalyAcknowledgedFilter] = useState("all");
  const [overrideEntityTypeFilter, setOverrideEntityTypeFilter] = useState("");
  const [overrideEntityIdFilter, setOverrideEntityIdFilter] = useState("");

  const [rollbackRevisionId, setRollbackRevisionId] = useState("");
  const [rollbackField, setRollbackField] = useState("");
  const [rollbackRecordId, setRollbackRecordId] = useState("");
  const [ackAnomalyId, setAckAnomalyId] = useState("");
  const [killSource, setKillSource] = useState("");
  const [killEnabled, setKillEnabled] = useState(true);
  const [overrideCreateSource, setOverrideCreateSource] = useState("");
  const [overrideCreateField, setOverrideCreateField] = useState("");
  const [overrideCreateValue, setOverrideCreateValue] = useState("");
  const [overrideUpdateId, setOverrideUpdateId] = useState("");
  const [overrideUpdateValue, setOverrideUpdateValue] = useState("");
  const [detailItem, setDetailItem] = useState<PipelineItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [freshnessError, setFreshnessError] = useState<string | null>(null);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const parsedLimit = Number.parseInt(listLimit, 10);
      const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
      const anomalyParams = {
        limit,
        severity: anomalySeverityFilter.trim() || undefined,
        acknowledged:
          anomalyAcknowledgedFilter === "all"
            ? undefined
            : anomalyAcknowledgedFilter === "true"
              ? true
              : false,
      };
      const overrideParams = {
        limit,
        entity_type: overrideEntityTypeFilter.trim() || undefined,
        entity_id: overrideEntityIdFilter.trim() || undefined,
      };
      setFreshnessError(null);
      const [
        healthRes,
        coverageRes,
        gapsRes,
        revisionsRes,
        rejectedRes,
        freshnessRes,
        anomaliesRes,
        killRes,
        overridesRes,
      ] = await Promise.allSettled([
        getPipelineHealth(),
        getPipelineCoverage(),
        listPipelineCoverageGaps({ limit }),
        listPipelineRevisions({ limit }),
        listPipelineRejected({ limit }),
        listPipelineFreshness({ limit }),
        listPipelineAnomalies(anomalyParams),
        listPipelineKillSwitches(),
        listPipelineFieldOverrides(overrideParams),
      ]);

      if (healthRes.status === "fulfilled") setHealth(healthRes.value);
      if (coverageRes.status === "fulfilled") {
        setCoverage(coverageRes.value);
        const extractedCoverageItems =
          coverageRes.value && Array.isArray((coverageRes.value as Record<string, unknown>).items)
            ? (((coverageRes.value as Record<string, unknown>).items as unknown[]) as PipelineItem[])
            : [];
        setCoverageItems(extractedCoverageItems);
      } else {
        setCoverageItems([]);
      }
      if (gapsRes.status === "fulfilled") setCoverageGaps(gapsRes.value.items);
      if (revisionsRes.status === "fulfilled") setRevisions(revisionsRes.value.items);
      if (rejectedRes.status === "fulfilled") setRejected(rejectedRes.value.items);
      if (freshnessRes.status === "fulfilled") {
        setFreshness(freshnessRes.value.items);
      } else {
        setFreshness([]);
        const err =
          freshnessRes.reason instanceof ApiError || freshnessRes.reason instanceof Error
            ? freshnessRes.reason.message
            : "Freshness is unavailable right now.";
        setFreshnessError(err);
      }
      if (anomaliesRes.status === "fulfilled") setAnomalies(anomaliesRes.value.items);
      if (killRes.status === "fulfilled") setKillSwitches(killRes.value.items);
      if (overridesRes.status === "fulfilled") setFieldOverrides(overridesRes.value.items);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load pipeline data.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [anomalyAcknowledgedFilter, anomalySeverityFilter, listLimit, overrideEntityIdFilter, overrideEntityTypeFilter]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  async function onAction(action: () => Promise<void>, message: string) {
    try {
      await action();
      toast.success(message);
      await loadPipeline();
    } catch (error) {
      const msg = error instanceof ApiError || error instanceof Error ? error.message : "Request failed.";
      toast.error(msg);
    }
  }

  function resolveRecordId(item: PipelineItem, fallbackIndex: number): string {
    return String(item.id ?? item.source ?? item.revision_id ?? item.record_id ?? fallbackIndex);
  }

  function listCard(title: string, items: PipelineItem[], section: string) {
    const safeItems = Array.isArray(items) ? items : [];
    const keys = safeItems.length ? Object.keys(safeItems[0] ?? {}).slice(0, 4) : [];
    return (
      <Card className="border-purple-100 bg-white">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Total: {safeItems.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-purple-100">
            <table className="w-full text-left">
              <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                <tr>
                  {keys.map((key) => (
                    <th key={key} className="px-3 py-2">
                      {key}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeItems.map((item, idx) => (
                  <tr key={String(item.id ?? idx)} className="border-t border-purple-100">
                    {keys.map((key) => (
                      <td key={key} className="px-3 py-2 text-xs text-zinc-700">
                        {String(item[key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      {resolveRecordId(item, idx) ? (
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="border-purple-200">
                          <Link href={`/admin/pipeline/${encodeURIComponent(section)}/${encodeURIComponent(resolveRecordId(item, idx))}?mode=view`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                          <Link href={`/admin/pipeline/${encodeURIComponent(section)}/${encodeURIComponent(resolveRecordId(item, idx))}?mode=edit`}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-200"
                          onClick={() => {
                            setDetailItem(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Pipeline Admin" subtitle="Health, revisions, anomalies, kill switches, and overrides." onRefresh={loadPipeline} />
      <Card className="mb-4 border-purple-100 bg-white">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-limit">List Limit</Label>
            <Input id="pipeline-limit" type="number" min={1} value={listLimit} onChange={(e) => setListLimit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-anomaly-severity">Anomaly Severity</Label>
            <Input id="pipeline-anomaly-severity" value={anomalySeverityFilter} onChange={(e) => setAnomalySeverityFilter(e.target.value)} placeholder="critical / high" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-anomaly-ack">Anomaly Acknowledged</Label>
            <Input
              id="pipeline-anomaly-ack"
              value={anomalyAcknowledgedFilter}
              onChange={(e) => setAnomalyAcknowledgedFilter(e.target.value)}
              placeholder="all / true / false"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-override-entity-type">Override Entity Type</Label>
            <Input id="pipeline-override-entity-type" value={overrideEntityTypeFilter} onChange={(e) => setOverrideEntityTypeFilter(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pipeline-override-entity-id">Override Entity ID</Label>
            <Input id="pipeline-override-entity-id" value={overrideEntityIdFilter} onChange={(e) => setOverrideEntityIdFilter(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PipelineTab)}>
          <TabsList className="mb-4 h-auto flex-wrap justify-start">
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="freshness">Freshness</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="kill-switches">Kill Switches</TabsTrigger>
            <TabsTrigger value="field-overrides">Field Overrides</TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <Card className="border-purple-100 bg-white">
              <CardHeader>
                <CardTitle>Pipeline Health Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-3 py-2">Metric</th>
                        <th className="px-3 py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(health ?? {}).map(([key, value]) => (
                        <tr key={key} className="border-t border-purple-100">
                          <td className="px-3 py-2 text-xs text-zinc-700">{key}</td>
                          <td className="px-3 py-2 text-xs text-zinc-700">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Coverage Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-purple-100">
                    <table className="w-full text-left">
                      <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                        <tr>
                          <th className="px-3 py-2">Metric</th>
                          <th className="px-3 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coverage ?? {})
                          .filter(([key]) => key !== "items")
                          .map(([key, value]) => (
                          <tr key={key} className="border-t border-purple-100">
                            <td className="px-3 py-2 text-xs text-zinc-700">{key}</td>
                            <td className="px-3 py-2 text-xs text-zinc-700">{String(value)}</td>
                          </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              {listCard("Coverage By Category", coverageItems, "coverage")}
              {listCard("Coverage Gaps", coverageGaps, "coverage-gaps")}
            </div>
          </TabsContent>

          <TabsContent value="revisions">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Rollback Revision</CardTitle>
                  <CardDescription>Rollback a specific field revision.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rollback-revision-id">Revision ID</Label>
                    <Input id="rollback-revision-id" value={rollbackRevisionId} onChange={(e) => setRollbackRevisionId(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rollback-field">Field</Label>
                    <Input id="rollback-field" value={rollbackField} onChange={(e) => setRollbackField(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rollback-record-id">Record ID</Label>
                    <Input id="rollback-record-id" value={rollbackRecordId} onChange={(e) => setRollbackRecordId(e.target.value)} />
                  </div>
                  <Button
                    className="w-full bg-purple-700 hover:bg-purple-800"
                    onClick={() =>
                      void onAction(async () => {
                        if (!rollbackRevisionId.trim() || !rollbackField.trim() || !rollbackRecordId.trim()) {
                          throw new Error("Revision ID, field, and record ID are required.");
                        }
                        await rollbackPipelineRevision({
                          revision_id: rollbackRevisionId.trim(),
                          field: rollbackField.trim(),
                          record_id: rollbackRecordId.trim(),
                        });
                      }, "Revision rollback requested.")
                    }
                  >
                    Rollback Field Revision
                  </Button>
                </CardContent>
              </Card>
              {listCard("Recent Revisions", revisions, "revisions")}
            </div>
          </TabsContent>

          <TabsContent value="rejected">{listCard("Rejected Staging Rows", rejected, "rejected")}</TabsContent>
          <TabsContent value="freshness">
            <div className="space-y-3">
              {freshnessError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Freshness data is temporarily unavailable from backend: {freshnessError}
                </div>
              ) : null}
              {listCard("Freshness (past TTL)", freshness, "freshness")}
            </div>
          </TabsContent>

          <TabsContent value="anomalies">
            <div className="grid gap-5 lg:grid-cols-2">
              {listCard("Anomalies", anomalies, "anomalies")}
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Acknowledge Anomaly</CardTitle>
                  <CardDescription>Mark an anomaly as acknowledged.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ack-anomaly-id">Anomaly ID</Label>
                    <Input id="ack-anomaly-id" value={ackAnomalyId} onChange={(e) => setAckAnomalyId(e.target.value)} />
                  </div>
                  <Button
                    className="w-full bg-purple-700 hover:bg-purple-800"
                    onClick={() =>
                      void onAction(async () => {
                        if (!ackAnomalyId.trim()) throw new Error("Anomaly ID is required.");
                        await acknowledgePipelineAnomaly(ackAnomalyId.trim());
                      }, "Anomaly acknowledged.")
                    }
                  >
                    Acknowledge
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kill-switches">
            <div className="grid gap-5 lg:grid-cols-2">
              {listCard("Kill Switches", killSwitches, "kill-switches")}
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Toggle Source</CardTitle>
                  <CardDescription>Enable or disable a source kill switch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="kill-source">Source</Label>
                    <Input id="kill-source" value={killSource} onChange={(e) => setKillSource(e.target.value)} placeholder="cardekho" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={killEnabled} onChange={(e) => setKillEnabled(e.target.checked)} />
                    Enabled
                  </label>
                  <Button
                    className="w-full bg-purple-700 hover:bg-purple-800"
                    onClick={() =>
                      void onAction(async () => {
                        if (!killSource.trim()) throw new Error("Source is required.");
                        await togglePipelineKillSwitch(killSource.trim(), { enabled: killEnabled });
                      }, "Kill switch updated.")
                    }
                  >
                    Update Kill Switch
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="field-overrides">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Create / Replace Field Override</CardTitle>
                  <CardDescription>Create or replace a field override.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="override-create-source">Source</Label>
                    <Input id="override-create-source" value={overrideCreateSource} onChange={(e) => setOverrideCreateSource(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-create-field">Field</Label>
                    <Input id="override-create-field" value={overrideCreateField} onChange={(e) => setOverrideCreateField(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-create-value">Value</Label>
                    <Input id="override-create-value" value={overrideCreateValue} onChange={(e) => setOverrideCreateValue(e.target.value)} />
                  </div>
                  <Button
                    className="w-full bg-purple-700 hover:bg-purple-800"
                    onClick={() =>
                      void onAction(async () => {
                        if (!overrideCreateSource.trim() || !overrideCreateField.trim()) {
                          throw new Error("Source and field are required.");
                        }
                        await createPipelineFieldOverride({
                          source: overrideCreateSource.trim(),
                          field: overrideCreateField.trim(),
                          value: overrideCreateValue.trim(),
                        });
                        setOverrideCreateSource("");
                        setOverrideCreateField("");
                        setOverrideCreateValue("");
                      }, "Field override saved.")
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Save Override
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white">
                <CardHeader>
                  <CardTitle>Update / Delete Override</CardTitle>
                  <CardDescription>PATCH or DELETE by override id</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="override-id">Override ID</Label>
                    <Input id="override-id" value={overrideUpdateId} onChange={(e) => setOverrideUpdateId(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-update-value">Updated Value</Label>
                    <Input id="override-update-value" value={overrideUpdateValue} onChange={(e) => setOverrideUpdateValue(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() =>
                        void onAction(async () => {
                          if (!overrideUpdateId.trim()) throw new Error("Override ID is required.");
                          if (!overrideUpdateValue.trim()) throw new Error("Updated value is required.");
                          await updatePipelineFieldOverride(overrideUpdateId.trim(), { value: overrideUpdateValue.trim() });
                        }, "Field override updated.")
                      }
                    >
                      Update Override
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        void onAction(async () => {
                          if (!overrideUpdateId.trim()) throw new Error("Override ID is required.");
                          await deletePipelineFieldOverride(overrideUpdateId.trim());
                        }, "Field override deleted.")
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Override
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="lg:col-span-2">{listCard("Field Overrides", fieldOverrides, "field-overrides")}</div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>Inspect selected pipeline record.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-purple-100 bg-white">
            <table className="w-full text-left">
              <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                <tr>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(detailItem ?? {}).map(([key, value]) => (
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
