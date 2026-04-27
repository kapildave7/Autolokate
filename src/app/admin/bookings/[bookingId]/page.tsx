import { AdminBookingDetailPageClient } from "@/components/admin/admin-booking-detail-page-client";

type Props = {
  params: Promise<{ bookingId: string }>;
};

export default async function AdminBookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  return <AdminBookingDetailPageClient bookingId={bookingId} />;
}
