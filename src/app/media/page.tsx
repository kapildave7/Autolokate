import type { Metadata } from "next";
import { MediaPageClient } from "@/components/media/media-page-client";

export const metadata: Metadata = {
  title: "Media — videos, news, reviews & comparisons",
  description:
    "Autolokate media hub: video road tests, car news, long-form reviews, and comparison editorials — interlinked with live inventory.",
  keywords: "car videos India, automotive news, car reviews, car comparison articles",
};

export default function MediaHomePage() {
  return <MediaPageClient />;
}
