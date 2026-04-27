import { AdminPipelineDetailPageClient } from "@/components/admin/admin-pipeline-detail-page-client";

type Props = {
  params: Promise<{
    section: "revisions" | "rejected" | "freshness" | "anomalies" | "kill-switches" | "field-overrides" | "coverage-gaps";
    recordId: string;
  }>;
};

export default async function AdminPipelineDetailPage({ params }: Props) {
  const { section, recordId } = await params;
  return <AdminPipelineDetailPageClient section={section} recordId={recordId} />;
}
