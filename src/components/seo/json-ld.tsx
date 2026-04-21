import type { ArticleDoc, Car, CarReview } from "@/data/types";
import { carListingRichDescription } from "@/lib/seo/car-page-seo";
import { carDetailPath } from "@/lib/seo/paths";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { slugifyPart } from "@/lib/seo/slugs";
import { formatINR } from "@/lib/utils";

type BreadcrumbItem = { name: string; href: string };

export function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE_URL}${item.href}`,
    })),
  };
}

/** Breadcrumb trail for a listing detail URL (matches on-page `SeoBreadcrumbs` intent). */
export function carDetailBreadcrumbJsonLd(car: Car) {
  const brandSlug = slugifyPart(car.brand);
  return breadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Browse cars", href: "/cars" },
    { name: car.brand, href: `/cars/brand/${brandSlug}` },
    { name: `${car.model} · ${car.year}`, href: carDetailPath(car) },
  ]);
}

function aggregateRatingFromReviews(reviews: CarReview[] | undefined) {
  if (!reviews?.length) return undefined;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const ratingValue = Math.round((sum / reviews.length) * 10) / 10;
  return {
    "@type": "AggregateRating" as const,
    ratingValue,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

export function carProductJsonLd(car: Car, description: string) {
  const url = `${SITE_URL}${carDetailPath(car)}`;
  const images = car.images?.length ? car.images : [];
  const reviewNodes = car.reviews?.map((r: CarReview) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    datePublished: r.date,
    reviewBody: r.body,
    name: r.title,
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
  }));
  const aggregateRating = aggregateRatingFromReviews(car.reviews);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${car.brand} ${car.model} ${car.variant}`,
    description,
    image: images,
    sku: car.id,
    mpn: `${car.brand}-${car.model}-${car.year}-${car.id}`.replace(/\s+/g, "-"),
    brand: { "@type": "Brand", name: car.brand },
    category: `${car.bodyType} · ${car.fuel}`,
    color: car.exteriorColor,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: car.price,
      availability: "https://schema.org/InStock",
      itemCondition: car.isNew ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      priceValidUntil: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviewNodes?.length ? { review: reviewNodes } : {}),
  };
}

export function vehicleJsonLd(car: Car, description: string) {
  const url = `${SITE_URL}${carDetailPath(car)}`;
  const images = car.images?.length ? car.images : [];
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${car.brand} ${car.model} ${car.variant}`,
    model: car.model,
    brand: { "@type": "Brand", name: car.brand },
    vehicleModelDate: String(car.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.kms,
      unitCode: "KMT",
    },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    numberOfPreviousOwners: car.owners,
    color: car.exteriorColor,
    bodyType: car.bodyType,
    description,
    url,
    image: images.length ? images : undefined,
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "INR",
      url,
      availability: "https://schema.org/InStock",
    },
  };
}

/** FAQPage aligned with listing FAQ accordion (keep in sync with `car-detail-view` copy). */
export function carListingFaqJsonLd(car: Car) {
  const qPrice = `What price is shown for this ${car.brand} ${car.model}?`;
  const aPrice = `The listing shows ${formatINR(car.price)} as advertised in our catalog. Anything beyond that — taxes, insurance, on-road charges — is outside what we verify here.`;

  const qMileage = `What mileage is listed for this ${car.fuel} ${car.bodyType.toLowerCase()}?`;
  const aMileage = `The listing states ${car.mileage}. Real-world economy varies with traffic, tyres, and maintenance; service records in the timeline on this page are part of the same informational snapshot.`;

  const qCert = "Is this vehicle certified on Autolokate?";
  const aCert = car.certified
    ? "Yes — see the inspection checklist in the details on this page."
    : "No — review the inspection section and consider an independent check.";

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: qPrice,
        acceptedAnswer: { "@type": "Answer", text: aPrice },
      },
      {
        "@type": "Question",
        name: qMileage,
        acceptedAnswer: { "@type": "Answer", text: aMileage },
      },
      {
        "@type": "Question",
        name: qCert,
        acceptedAnswer: { "@type": "Answer", text: aCert },
      },
    ],
  };
}

export function articleJsonLd(post: ArticleDoc, path: "/blog" | "/media" = "/blog") {
  const url = `${SITE_URL}${path}/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    image: post.coverImage ? [post.coverImage] : undefined,
    mainEntityOfPage: url,
    keywords: post.tags?.join(", "),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/cars?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** Organization — sitewide brand entity for knowledge panels / consistency. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/autolokate_light.png`,
    description:
      "Car research and comparison for India — browse listings, compare specs and prices, read stories, and book expert guidance.",
    sameAs: ["https://www.youtube.com/@IndianDriveGuide"],
  };
}

/** Rich plain-text for JSON-LD Product/Vehicle `description` fields. */
export function carSeoDescription(car: Car): string {
  return carListingRichDescription(car);
}
