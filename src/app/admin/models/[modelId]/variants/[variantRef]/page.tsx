import { AdminVariantDetailPageClient } from "@/components/admin/admin-variant-detail-page-client";

type Props = {
  params: Promise<{ modelId: string; variantRef: string }>;
};

export default async function AdminVariantDetailPage({ params }: Props) {
  const { modelId, variantRef } = await params;
  return <AdminVariantDetailPageClient modelId={modelId} variantRef={variantRef} />;
}
