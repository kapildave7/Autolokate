import { AdminScraperRunDetailPageClient } from "@/components/admin/admin-scraper-run-detail-page-client";

type Props = {
  params: Promise<{ runId: string }>;
};

export default async function AdminScraperRunDetailPage({ params }: Props) {
  const { runId } = await params;
  return <AdminScraperRunDetailPageClient runId={runId} />;
}
