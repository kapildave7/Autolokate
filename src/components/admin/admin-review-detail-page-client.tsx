"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { AdminEmptyState, AdminLoadingState } from "@/components/admin/ui/admin-page-state";
import { AdminValueRenderer } from "@/components/admin/ui/admin-value-renderer";
import { DetailModeBadge } from "@/components/admin/ui/detail-mode-badge";
import { readDetailMode } from "@/components/admin/ui/detail-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAdminReview,
  listAdminReviews,
  type AdminReview,
  type AdminReviewType,
  type ReviewStatus,
  updateAdminReview,
  updateAdminReviewStatus,
} from "@/lib/client/admin-reviews-api";
import { ApiError } from "@/lib/client/api-client";

export function AdminReviewDetailPageClient({ reviewId }: { reviewId: string }) {
  const searchParams = useSearchParams();
  const mode = readDetailMode(searchParams.get("mode"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [review, setReview] = useState<AdminReview | null>(null);
  const [type, setType] = useState<AdminReviewType>("model");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("draft");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [modelRes, variantRes] = await Promise.all([
        listAdminReviews({ type: "model", page: 1, limit: 500, status: "all" }),
        listAdminReviews({ type: "variant", page: 1, limit: 500, status: "all" }),
      ]);
      const foundModel = modelRes.items.find((item) => item.id === reviewId) ?? null;
      const foundVariant = variantRes.items.find((item) => item.id === reviewId) ?? null;
      const found = foundModel ?? foundVariant;
      if (!found) {
        setReview(null);
        return;
      }
      setReview(found);
      setType(foundModel ? "model" : "variant");
      setTitle(String(found.title ?? ""));
      setSummary(String(found.summary ?? ""));
      setContent(String(found.content ?? ""));
      setRating(typeof found.rating === "number" ? String(found.rating) : "");
      setStatus((String(found.status ?? "draft") as ReviewStatus) || "draft");
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to load review detail.";
      toast.error(message);
      setReview(null);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => (review ? Object.entries(review) : []), [review]);

  async function onSave() {
    if (!review) return;
    setSaving(true);
    try {
      await updateAdminReview({
        type,
        id: review.id,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        rating: rating.trim() ? Number(rating) : null,
      });
      await updateAdminReviewStatus(type, review.id, status);
      toast.success("Review updated.");
      await load();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to update review.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!review) return;
    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAdminReview(type, review.id);
      toast.success("Review deleted.");
      window.location.href = "/admin/reviews";
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "Failed to delete review.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader title="Review Details" subtitle="Full review details and edit/update actions." onRefresh={load} />
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="outline" className="border-purple-200">
          <Link href="/admin/reviews">Back to Reviews</Link>
        </Button>
        <DetailModeBadge mode={mode} />
      </div>
      {loading ? (
        <AdminLoadingState label="Loading review details..." />
      ) : !review ? (
        <AdminEmptyState label="Review not found." />
      ) : (
        <div className="space-y-6">
          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
              <CardDescription>All fields from review payload.</CardDescription>
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
              <CardTitle>Edit Review</CardTitle>
              <CardDescription>Structured form for review content and status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as AdminReviewType)}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="variant">Variant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus)}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Summary</Label>
                <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Content</Label>
                <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <Input type="number" min={0} max={5} step={0.1} value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="destructive" disabled={deleting} onClick={() => void onDelete()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
                <Button className="bg-purple-700 hover:bg-purple-800" disabled={saving} onClick={() => void onSave()}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Review"
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
