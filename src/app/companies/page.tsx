import type { Metadata } from "next";
import { CompaniesDirectory } from "@/components/companies/companies-directory";

export const metadata: Metadata = {
  title: "Partner dealers & showrooms",
  description: "Verified dealer profiles across India — inventory, ratings, and contact on Autolokate.",
};

export default function CompaniesPage() {
  return <CompaniesDirectory />;
}
