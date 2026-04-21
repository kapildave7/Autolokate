import { redirect } from "next/navigation";

type Props = { params: Promise<{ brandSlug: string; modelSlug: string }> };

export default async function CarDetailByBrandPage({ params }: Props) {
  const { brandSlug, modelSlug } = await params;
  redirect(`/cars/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`);
}
