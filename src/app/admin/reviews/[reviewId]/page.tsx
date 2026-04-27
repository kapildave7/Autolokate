import { AdminReviewDetailPageClient } from "@/components/admin/admin-review-detail-page-client";

type Props = {
  params: Promise<{ reviewId: string }>;
};

export default async function AdminReviewDetailPage({ params }: Props) {
  const { reviewId } = await params;
  return <AdminReviewDetailPageClient reviewId={reviewId} />;
}
