import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentShell } from "@/components/legal/legal-document-shell";
import { fetchPrivacyPolicy } from "@/lib/legal/legal-public-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await fetchPrivacyPolicy();
  return {
    title: doc?.title ?? "Privacy Policy",
    description: doc
      ? `${doc.title} — Autolokate (version ${doc.version}).`
      : "Privacy policy and data practices on Autolokate.",
  };
}

export default async function PrivacyPolicyPage() {
  const doc = await fetchPrivacyPolicy();
  if (!doc) notFound();
  return <LegalDocumentShell doc={doc} />;
}
