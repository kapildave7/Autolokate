import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bikes, videos } from "@/data";
import { bikeIdFromSlug } from "@/lib/seo/bike-paths";
import { BikeDetailView } from "@/components/bikes/bike-detail-view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = bikeIdFromSlug(slug);
  const bike = id ? bikes.find((b) => b.id === id) : undefined;
  if (!bike) return { title: "Bike" };
  return {
    title: `${bike.brand} ${bike.model} — specs, price, video`,
    description: `${bike.brand} ${bike.model} ${bike.variant}: price, body type, and walkaround clips from Indian Drive Guide.`,
  };
}

export default async function BikeDetailPage({ params }: Props) {
  const { slug } = await params;
  const id = bikeIdFromSlug(slug);
  const bike = id ? bikes.find((b) => b.id === id) : undefined;
  if (!bike) notFound();
  const v = (bike.videoSlug ? videos.find((x) => x.slug === bike.videoSlug) : undefined) ?? videos[0];
  const sameModel = bikes.filter((x) => x.brand === bike.brand && x.model === bike.model);
  const similar = bikes.filter((x) => x.bodyType === bike.bodyType && x.id !== bike.id).slice(0, 4);
  return <BikeDetailView bike={bike} relatedVideo={v} sameModel={sameModel} similar={similar} />;
}

