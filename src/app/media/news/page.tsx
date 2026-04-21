import type { Metadata } from "next";
import { MediaEditorialHub } from "@/components/media/media-editorial-hub";
import { getArticlesByCategory } from "@/data/blog";

export const metadata: Metadata = {
  title: "Car News India — Latest launches, industry & policy",
  description:
    "Automotive news from Autolokate: launches, policy, and market moves — structured for discovery alongside our listings.",
  keywords: "car news India, auto news, vehicle launches India, Autolokate media",
};

export default function MediaNewsPage() {
  const posts = getArticlesByCategory("News");
  return (
    <MediaEditorialHub
      variant="news"
      title="News"
      subtitle="Launches, policy shifts, and market moves — short, sharp context so you can connect headlines to listings and long-term ownership costs."
      posts={posts}
      secondaryCta={{ href: "/blog?cat=News", label: "More news on the desk" }}
    />
  );
}
