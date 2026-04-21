import type { Metadata } from "next";
import { MediaEditorialHub } from "@/components/media/media-editorial-hub";
import { getArticlesByCategory } from "@/data/blog";

export const metadata: Metadata = {
  title: "Car Comparisons India — Which model to buy",
  description:
    "Comparison editorials: segment rivals, spec sheets, and buyer trade-offs — paired with our live compare tool.",
  keywords: "car comparison India, SUV comparison, which car to buy, Autolokate",
};

export default function MediaComparisonPage() {
  const posts = getArticlesByCategory("Comparisons");
  return (
    <MediaEditorialHub
      variant="comparison"
      title="Comparisons"
      subtitle="Side-by-side breakdowns of segment rivals, spec deltas, and what actually matters on Indian roads. When you’re ready, open the live compare tray against real inventory."
      posts={posts}
      secondaryCta={{ href: "/compare", label: "Open compare tray" }}
    />
  );
}
