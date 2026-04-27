import { AdminSupportDetailPageClient } from "@/components/admin/admin-support-detail-page-client";

type Props = {
  params: Promise<{ grievanceId: string }>;
};

export default async function AdminSupportDetailPage({ params }: Props) {
  const { grievanceId } = await params;
  return <AdminSupportDetailPageClient grievanceId={grievanceId} />;
}
