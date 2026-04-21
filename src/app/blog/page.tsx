import type { Metadata } from "next";
import { BlogExplore } from "@/components/blog/blog-explore";

export const metadata: Metadata = {
  title: "Car stories — reviews, guides & comparisons",
  description:
    "Editorial hub: used car buying guides, EV ownership, highway fuel tests, and segment comparisons — structured with H1/H2 for search.",
  keywords: "car blog India, car buying guide, car review India, SUV guide, Autolokate stories",
};

export default function BlogPage() {
  return <BlogExplore />;
}
