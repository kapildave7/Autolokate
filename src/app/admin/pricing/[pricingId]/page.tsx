import { AdminPricingDetailPageClient } from "@/components/admin/admin-pricing-detail-page-client";

type Props = {
  params: Promise<{ pricingId: string }>;
};

export default async function AdminPricingDetailPage({ params }: Props) {
  const { pricingId } = await params;
  return <AdminPricingDetailPageClient pricingId={pricingId} />;
}
