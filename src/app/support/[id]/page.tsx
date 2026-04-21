import type { Metadata } from "next";
import { SupportGrievanceDetail } from "@/components/support/support-grievance-detail";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Ticket ${id.slice(0, 8)}… — Support`,
    description: "View your support grievance on Autolokate.",
  };
}

export default async function SupportTicketPage({ params }: Props) {
  const { id } = await params;
  return <SupportGrievanceDetail id={id} />;
}
