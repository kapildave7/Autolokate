"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createAdminReview,
  deleteAdminReview,
  listAdminReviews,
  type AdminReview,
  type AdminReviewType,
  type ReviewStatus,
  updateAdminReview,
  updateAdminReviewStatus,
} from "@/lib/client/admin-reviews-api";
import { ApiError } from "@/lib/client/api-client";
import { getModels, getModelVariants } from "@/lib/client/catalogue-api";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Array<ReviewStatus | "all"> = ["all", "draft", "published", "archived"];
const REVIEW_TYPE_OPTIONS: AdminReviewType[] = ["model", "variant"];
type BadgeVariant = "default" | "secondary" | "warning";

type ReviewFormState = {
  targetId: string;
  title: string;
  summary: string;
  content: string;
  rating: string;
};

const initialFormState: ReviewFormState = {
  targetId: "",
  title: "",
  summary: "",
  content: "",
  rating: "",
};

function formatDate(dateLike: unknown): string {
  if (typeof dateLike !== "string") return "—";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "published") return "default";
  if (status === "archived") return "warning";
  return "secondary";
}

export function AdminReviewsPageClient() {
  const [reviewType, setReviewType] = useState<AdminReviewType>("model");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [createForm, setCreateForm] = useState<ReviewFormState>(initialFormState);
  const [editForm, setEditForm] = useState<ReviewFormState>(initialFormState);
  const [catalogueModels, setCatalogueModels] = useState<Record<string, unknown>[]>([]);
  const [variantOptions, setVariantOptions] = useState<Record<string, unknown>[]>([]);
  const [selectedModelForVariant, setSelectedModelForVariant] = useState("");
  const [loadingTargets, setLoadingTargets] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 350);
  const totalPages = Math.max(1, Math.ceil(totalReviews / PAGE_SIZE));

  const loadReviews = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await listAdminReviews({
        type: reviewType,
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery.trim() || undefined,
        status: statusFilter,
      });
      setReviews(response.items);
      setTotalReviews(response.total);

      if (!response.items.length) {
        setSelectedReviewId(null);
        setSelectedReview(null);
      } else if (!selectedReviewId || !response.items.some((item) => item.id === selectedReviewId)) {
        const first = response.items[0] ?? null;
        setSelectedReviewId(first?.id ?? null);
        setSelectedReview(first);
      } else {
        const current = response.items.find((item) => item.id === selectedReviewId) ?? null;
        setSelectedReview(current);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load reviews.";
      toast.error(message);
      setReviews([]);
      setTotalReviews(0);
      setSelectedReviewId(null);
      setSelectedReview(null);
    } finally {
      setIsLoadingList(false);
    }
  }, [debouncedQuery, page, reviewType, selectedReviewId, statusFilter]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, statusFilter, reviewType]);

  useEffect(() => {
    if (!selectedReview) {
      setEditForm(initialFormState);
      return;
    }
    setEditForm({
      targetId: String(selectedReview.model_id ?? selectedReview.variant_id ?? ""),
      title: String(selectedReview.title ?? ""),
      summary: String(selectedReview.summary ?? ""),
      content: String(selectedReview.content ?? ""),
      rating:
        typeof selectedReview.rating === "number" && Number.isFinite(selectedReview.rating)
          ? String(selectedReview.rating)
          : "",
    });
  }, [selectedReview]);

  useEffect(() => {
    async function loadModels() {
      setLoadingTargets(true);
      try {
        const rows = await getModels();
        setCatalogueModels(rows as Record<string, unknown>[]);
      } catch {
        setCatalogueModels([]);
      } finally {
        setLoadingTargets(false);
      }
    }
    void loadModels();
  }, []);

  const modelOptions = useMemo(
    () =>
      catalogueModels
        .map((row) => {
          const id = String(row.id ?? "").trim();
          const name = String(row.model_name ?? row.name ?? "Unnamed Model").trim();
          const brand = String(row.brand_name ?? "").trim();
          const brandSlug = String(row.brand_slug ?? "").trim();
          const modelSlug = String(row.slug ?? row.model_slug ?? "").trim();
          if (!id) return null;
          return {
            id,
            label: brand ? `${name} (${brand})` : name,
            brandSlug,
            modelSlug,
          };
        })
        .filter((item): item is { id: string; label: string; brandSlug: string; modelSlug: string } => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [catalogueModels]
  );

  useEffect(() => {
    if (reviewType !== "variant") {
      setVariantOptions([]);
      setSelectedModelForVariant("");
      return;
    }
    async function loadVariants() {
      const selectedModel = modelOptions.find((item) => item.id === selectedModelForVariant);
      if (!selectedModel?.brandSlug || !selectedModel?.modelSlug) {
        setVariantOptions([]);
        return;
      }
      setLoadingTargets(true);
      try {
        const variants = await getModelVariants(selectedModel.brandSlug, selectedModel.modelSlug);
        setVariantOptions(variants as Record<string, unknown>[]);
      } catch {
        setVariantOptions([]);
      } finally {
        setLoadingTargets(false);
      }
    }
    void loadVariants();
  }, [reviewType, selectedModelForVariant, modelOptions]);

  async function onRefresh() {
    await loadReviews();
  }

  async function onCreateReview() {
    if (!createForm.targetId.trim()) {
      toast.error(`Please enter ${reviewType === "model" ? "model" : "variant"} ID.`);
      return;
    }
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setIsSavingCreate(true);
    try {
      await createAdminReview({
        type: reviewType,
        targetId: createForm.targetId.trim(),
        title: createForm.title.trim(),
        summary: createForm.summary.trim() || undefined,
        content: createForm.content.trim(),
        rating: createForm.rating ? Number(createForm.rating) : undefined,
      });
      toast.success("Review created successfully.");
      setCreateForm(initialFormState);
      await loadReviews();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create review.";
      toast.error(message);
    } finally {
      setIsSavingCreate(false);
    }
  }

  async function onUpdateReview() {
    if (!selectedReviewId) return;
    setIsSavingEdit(true);
    try {
      await updateAdminReview({
        type: reviewType,
        id: selectedReviewId,
        title: editForm.title.trim(),
        summary: editForm.summary.trim(),
        content: editForm.content.trim(),
        rating: editForm.rating ? Number(editForm.rating) : null,
      });
      toast.success("Review updated.");
      await loadReviews();
      setIsEditOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update review.";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function onUpdateStatus(status: ReviewStatus) {
    if (!selectedReviewId) return;
    setIsUpdatingStatus(true);
    try {
      await updateAdminReviewStatus(reviewType, selectedReviewId, status);
      toast.success(`Review marked as ${status}.`);
      await loadReviews();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update status.";
      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function onDeleteReview() {
    if (!selectedReviewId) return;
    const confirmed = window.confirm("Delete this review permanently?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAdminReview(reviewType, selectedReviewId);
      toast.success("Review deleted.");
      setSelectedReviewId(null);
      setSelectedReview(null);
      await loadReviews();
      setIsEditOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to delete review.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  const reviewTypeLabel = useMemo(
    () => (reviewType === "model" ? "Model Review" : "Variant Review"),
    [reviewType]
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardHeader
        title="Admin Reviews"
        subtitle="Create, edit, publish, archive, and manage catalogue reviews."
        onRefresh={onRefresh}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-purple-100 bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total reviews</CardDescription>
            <CardTitle className="text-3xl text-purple-700">{totalReviews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-5">
        <div className="space-y-5">
          <Card className="border-purple-100 bg-white">
            <CardHeader className="space-y-3">
              <CardTitle className="text-lg">Review Listing</CardTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label className="mb-1.5 block text-xs text-zinc-500">Type</Label>
                  <Select value={reviewType} onValueChange={(value) => setReviewType(value as AdminReviewType)}>
                    <SelectTrigger className="border-purple-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "model" ? "Model Reviews" : "Variant Reviews"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1">
                  <Label className="mb-1.5 block text-xs text-zinc-500">Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReviewStatus | "all")}>
                    <SelectTrigger className="border-purple-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "all" ? "All statuses" : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1">
                  <Label className="mb-1.5 block text-xs text-zinc-500">Search</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search..."
                      className="h-10 border-purple-200 pl-9 focus-visible:ring-purple-300"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingList ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-purple-200 py-14 text-center text-sm text-zinc-500">
                  No reviews found for this filter.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-purple-100">
                  <table className="w-full text-left">
                    <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((review) => {
                        const isSelected = review.id === selectedReviewId;
                        const status = String(review.status ?? "draft");
                        return (
                          <tr
                            key={review.id}
                            className={`cursor-pointer border-t border-purple-100 transition hover:bg-purple-50 ${
                              isSelected ? "bg-purple-50" : "bg-white"
                            }`}
                            onClick={() => {
                              setSelectedReviewId(review.id);
                              setSelectedReview(review);
                            }}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                              {String(review.title ?? "(Untitled)")}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-700">
                              {typeof review.rating === "number" ? review.rating.toFixed(1) : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(review.updated_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button asChild variant="outline" size="sm" className="border-purple-200">
                                  <Link
                                    href={`/admin/reviews/${encodeURIComponent(review.id)}?mode=view`}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    View
                                  </Link>
                                </Button>
                                <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
                                  <Link
                                    href={`/admin/reviews/${encodeURIComponent(review.id)}?mode=edit`}
                                    onClick={(event) => event.stopPropagation()}
                                  >
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
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-zinc-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-purple-200"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-200"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Create {reviewTypeLabel}</CardTitle>
              <CardDescription>New reviews are created as draft by default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{reviewType === "model" ? "Model ID" : "Variant ID"}</Label>
                  {reviewType === "model" ? (
                    <Select
                      value={createForm.targetId}
                      onValueChange={(value) => setCreateForm((prev) => ({ ...prev, targetId: value }))}
                    >
                      <SelectTrigger className="border-purple-200">
                        <SelectValue placeholder={loadingTargets ? "Loading models..." : "Select model by name"} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Select value={selectedModelForVariant} onValueChange={setSelectedModelForVariant}>
                        <SelectTrigger className="border-purple-200">
                          <SelectValue placeholder={loadingTargets ? "Loading models..." : "Select model first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={createForm.targetId}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, targetId: value }))}
                        disabled={!selectedModelForVariant}
                      >
                        <SelectTrigger className="border-purple-200">
                          <SelectValue placeholder={loadingTargets ? "Loading variants..." : "Select variant"} />
                        </SelectTrigger>
                        <SelectContent>
                          {variantOptions.map((variant) => {
                            const variantId = String(variant.id ?? "").trim();
                            const variantName = String(variant.variant_name ?? variant.name ?? "Unnamed Variant");
                            if (!variantId) return null;
                            return (
                              <SelectItem key={variantId} value={variantId}>
                                {variantName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Rating</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={createForm.rating}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, rating: event.target.value }))}
                    placeholder="4.5"
                    className="border-purple-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={createForm.title}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Review title"
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Summary</Label>
                <Input
                  value={createForm.summary}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, summary: event.target.value }))}
                  placeholder="Short summary (optional)"
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea
                  rows={6}
                  value={createForm.content}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Write review content..."
                  className="border-purple-200"
                />
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-800"
                disabled={isSavingCreate}
                onClick={() => void onCreateReview()}
              >
                {isSavingCreate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Draft
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>Update review content, status, or delete.</DialogDescription>
          </DialogHeader>
          {!selectedReviewId || !selectedReview ? (
            <p className="text-sm text-zinc-500">Select a review from listing first.</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{reviewType === "model" ? "Model ID" : "Variant ID"}</Label>
                <Input value={editForm.targetId} readOnly className="border-purple-200 bg-zinc-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Summary</Label>
                <Input value={editForm.summary} onChange={(event) => setEditForm((prev) => ({ ...prev, summary: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea rows={6} value={editForm.content} onChange={(event) => setEditForm((prev) => ({ ...prev, content: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={editForm.rating}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, rating: event.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-purple-200" disabled={isUpdatingStatus} onClick={() => void onUpdateStatus("draft")}>
              Draft
            </Button>
            <Button variant="outline" className="border-purple-200" disabled={isUpdatingStatus} onClick={() => void onUpdateStatus("published")}>
              Publish
            </Button>
            <Button variant="outline" className="border-purple-200" disabled={isUpdatingStatus} onClick={() => void onUpdateStatus("archived")}>
              Archive
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={() => void onDeleteReview()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button className="bg-purple-700 hover:bg-purple-800" disabled={isSavingEdit} onClick={() => void onUpdateReview()}>
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
