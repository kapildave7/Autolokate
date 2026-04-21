import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoDetailClient } from "@/components/media/video-detail-client";
import { getVideoBySlug, videos } from "@/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return videos.slice(0, 48).map((v) => ({ slug: v.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = getVideoBySlug(slug);
  if (!v) return { title: "Video" };
  return { title: v.title, description: v.description.slice(0, 160) };
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) notFound();
  return <VideoDetailClient video={video} />;
}
