import { AdminUserDetailPageClient } from "@/components/admin/admin-user-detail-page-client";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params;
  return <AdminUserDetailPageClient userId={userId} />;
}
