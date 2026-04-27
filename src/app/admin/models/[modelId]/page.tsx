import { AdminModelDetailPageClient } from "@/components/admin/admin-model-detail-page-client";

type Props = {
  params: Promise<{ modelId: string }>;
};

export default async function AdminModelDetailPage({ params }: Props) {
  const { modelId } = await params;
  return <AdminModelDetailPageClient modelId={modelId} />;
}
