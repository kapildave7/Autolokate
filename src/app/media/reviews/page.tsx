import type { Metadata } from "next";
import { MediaEditorialHub } from "@/components/media/media-editorial-hub";
import { getArticlesByCategory } from "@/data/blog";

export const metadata: Metadata = {
  title: "Car Reviews India — Road tests & ownership notes",
  description:
    "Hands-on style reviews and ownership notes: mileage, features, and real-world usability — Autolokate editorial.",
  keywords: "car reviews India, SUV review, hatchback review, Autolokate",
};

export default function MediaReviewsPage() {
  const posts = getArticlesByCategory("Reviews");
  return (
    <MediaEditorialHub
      variant="reviews"
      title="Reviews"
      subtitle="Long-form reviews with structured headings, real-world usability notes, and finance watch-outs — written for buyers who skim specs and read between the lines."
      posts={posts}
      secondaryCta={{ href: "/blog?cat=Reviews", label: "Browse all reviews" }}
    />
  );
}
