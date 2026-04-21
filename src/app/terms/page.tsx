import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentShell } from "@/components/legal/legal-document-shell";
import { fetchTermsOfService } from "@/lib/legal/legal-public-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchTermsOfService();
  return {
    title: doc?.title ?? "Terms of Service",
    description: doc
      ? `${doc.title} — Autolokate (version ${doc.version}).`
      : "Terms of service for using Autolokate.",
  };
}

export default async function TermsPage() {
  const doc = await fetchTermsOfService();
  if (!doc) notFound();
  return <LegalDocumentShell doc={doc} />;
}
