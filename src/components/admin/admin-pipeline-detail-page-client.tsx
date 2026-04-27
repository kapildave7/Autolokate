"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/client/api-client";
import {
  acknowledgePipelineAnomaly,
  deletePipelineFieldOverride,
  listPipelineAnomalies,
  listPipelineCoverageGaps,
  listPipelineFieldOverrides,
  listPipelineFreshness,
  listPipelineKillSwitches,
  listPipelineRejected,
  listPipelineRevisions,
  rollbackPipelineRevision,
  togglePipelineKillSwitch,
  type PipelineItem,
  updatePipelineFieldOverride,
} from "@/lib/client/admin-pipeline-api";

type Section = "revisions" | "rejected" | "freshness" | "anomalies" | "kill-switches" | "field-overrides" | "coverage-gaps";
type Props = { section: Section; recordId: string };

function resolveRecordId(item: PipelineItem, fallbackIndex: number): string {
  return String(item.id ?? item.source ?? item.revision_id ?? item.record_id ?? fallbackIndex);
}

export function AdminPipelineDetailPageClient({ section, recordId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<PipelineItem | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [overrideValue, setOverrideValue] = useState("");
  const [rollbackRevisionId, setRollbackRevisionId] = useState("");
  const [rollbackField, setRollbackField] = useState("");
  const [rollbackRecordId, setRollbackRecordId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let items: PipelineItem[] = [];
      if (section === "revisions") items = (await listPipelineRevisions()).items;
      if (section === "rejected") items = (await listPipelineRejected()).items;
      if (section === "freshness") items = (await listPipelineFreshness()).items;
      if (section === "anomalies") items = (await listPipelineAnomalies()).items;
      if (section === "kill-switches") items = (await listPipelineKillSwitches()).items;
      if (section === "field-overrides") items = (await listPipelineFieldOverrides()).items;
      if (section === "coverage-gaps") items = (await listPipelineCoverageGaps()).items;
      const selected = items.find((row, idx) => resolveRecordId(row, idx) === recordId) ?? null;
      setItem(selected);
      setEnabled(Boolean(selected?.enabled));
      setOverrideValue(String(selected?.value ?? ""));
      setRollbackRevisionId(String(selected?.revision_id ?? selected?.id ?? ""));
      setRollbackField(String(selected?.field ?? ""));
      setRollbackRecordId(String(selected?.record_id ?? ""));
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load pipeline detail.";
      toast.error(message);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [recordId, section]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => Object.entries(item ?? {}), [item]);

  async function onAcknowledge() {
    if (!item?.id) return;
    setSaving(true);
    try {
      await acknowledgePipelineAnomaly(String(item.id));
      toast.success("Anomaly acknowledged.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to acknowledge anomaly.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onToggleKillSwitch() {
    if (!item) return;
    const source = String(item.source ?? item.id ?? "");
    if (!source) return;
    setSaving(true);
    try {
      await togglePipelineKillSwitch(source, { enabled });
      toast.success("Kill switch updated.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to toggle kill switch.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateOverride() {
    if (!item?.id) return;
    setSaving(true);
    try {
      await updatePipelineFieldOverride(String(item.id), { value: overrideValue });
      toast.success("Field override updated.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update override.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteOverride() {
    if (!item?.id) return;
    setSaving(true);
    try {
      await deletePipelineFieldOverride(String(item.id));
      toast.success("Field override deleted.");
      window.location.href = "/admin/pipeline";
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to delete override.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onRollback() {
    setSaving(true);
    try {
      await rollbackPipelineRevision({
        revision_id: rollbackRevisionId.trim(),
        field: rollbackField.trim(),
        record_id: rollbackRecordId.trim(),
      });
      toast.success("Rollback requested.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to rollback revision.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Pipeline Record Detail" subtitle={`Section: ${section}`} onRefresh={load} />
      <div className="mb-4">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/pipeline">Back to Pipeline</Link>
        </Button>
      </div>
      {loading ? (
        <AdminLoadingState label="Loading pipeline record..." />
      ) : !item ? (
        <AdminEmptyState label="Pipeline record not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>All Response Keys</CardTitle>
              <CardDescription>Complete key visibility for this record.</CardDescription>
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

          {section === "anomalies" ? (
            <Card className="border-purple-100 bg-white">
              <CardHeader>
                <CardTitle>Acknowledge Anomaly</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onAcknowledge()}>
                  {saving ? "Saving..." : "Acknowledge"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {section === "kill-switches" ? (
            <Card className="border-purple-100 bg-white">
              <CardHeader>
                <CardTitle>Edit Kill Switch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  Enabled
                </label>
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onToggleKillSwitch()}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {section === "field-overrides" ? (
            <Card className="border-purple-100 bg-white">
              <CardHeader>
                <CardTitle>Edit Field Override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Value</Label>
                  <Input value={overrideValue} onChange={(e) => setOverrideValue(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="destructive" disabled={saving} onClick={() => void onDeleteOverride()}>
                    Delete
                  </Button>
                  <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onUpdateOverride()}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "revisions" ? (
            <Card className="border-purple-100 bg-white">
              <CardHeader>
                <CardTitle>Rollback Revision</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Revision ID</Label>
                  <Input value={rollbackRevisionId} onChange={(e) => setRollbackRevisionId(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Field</Label>
                  <Input value={rollbackField} onChange={(e) => setRollbackField(e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Record ID</Label>
                  <Input value={rollbackRecordId} onChange={(e) => setRollbackRecordId(e.target.value)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onRollback()}>
                    {saving ? "Saving..." : "Rollback"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
