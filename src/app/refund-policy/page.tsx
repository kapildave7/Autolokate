import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentShell } from "@/components/legal/legal-document-shell";
import { fetchRefundPolicy } from "@/lib/legal/legal-public-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchRefundPolicy();
  return {
    title: doc?.title ?? "Refund & cancellation",
    description: doc
      ? `${doc.title} — Autolokate (version ${doc.version}).`
      : "Refund and cancellation policy for Autolokate.",
  };
}

export default async function RefundPolicyPage() {
  const doc = await fetchRefundPolicy();
  if (!doc) notFound();
  return <LegalDocumentShell doc={doc} />;
}
