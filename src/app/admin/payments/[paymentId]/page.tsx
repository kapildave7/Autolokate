import { AdminPaymentDetailPageClient } from "@/components/admin/admin-payment-detail-page-client";

type Props = {
  params: Promise<{ paymentId: string }>;
};

export default async function AdminPaymentDetailPage({ params }: Props) {
  const { paymentId } = await params;
  return <AdminPaymentDetailPageClient paymentId={paymentId} />;
}
