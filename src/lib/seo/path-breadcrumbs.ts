/**
 * Builds breadcrumb trails from the URL path for site-wide navigation.
 * Pages with richer in-content trails (e.g. catalogue model, blog posts) opt out in `site-path-breadcrumbs.tsx`.
 */

import type { Crumb } from "@/components/seo/breadcrumbs";

/** Known first segments → label (rest are humanized from slug). */
const SEGMENT_LABELS: Record<string, string> = {
  cars: "Cars",
  explore: "Explore",
  brand: "Brand",
  brands: "Brands",
  bikes: "Bikes",
  compare: "Compare",
  catalogue: "Catalogue",
  "used-cars": "Used cars",
  "new-cars": "New cars",
  media: "Media",
  blog: "Stories",
  support: "Support",
  contact: "Contact",
  about: "About",
  community: "Community",
  companies: "Companies",
  sell: "Sell",
  checkout: "Checkout",
  dashboard: "Dashboard",
  user: "Account",
  dealer: "Dealer",
  login: "Sign in",
  signup: "Sign up",
  otp: "Verify",
  activate: "Activate",
  book: "Book",
  expert: "Expert",
  "book-expert": "Book expert",
  "test-drive": "Test drive",
  ai: "AI",
  "ai-access": "AI access",
  reviews: "Reviews",
  news: "News",
  comparison: "Comparisons",
  video: "Video",
  privacy: "Privacy",
  terms: "Terms",
  refund: "Refund policy",
  "refund-policy": "Refund policy",
  status: "Status",
  chat: "Chat",
  auth: "Account",
};

function humanizeSlug(seg: string): string {
  const lower = seg.toLowerCase();
  if (SEGMENT_LABELS[lower]) return SEGMENT_LABELS[lower];
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const MEDIA_TWO_SEGMENT_HUBS = new Set(["reviews", "news", "comparison", "video"]);

/**
 * When true, `SitePathBreadcrumbs` should not render — page supplies its own trail.
 */
export function shouldSuppressAutoBreadcrumb(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  const norm = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  const parts = norm.split("/").filter(Boolean);

  /** Immersive conversion page — full layout, no global strip */
  if (norm === "/book-expert") {
    return true;
  }

  /** Sign-in and auth flows use minimal chrome — no global strip */
  if (norm === "/login" || parts[0] === "auth") {
    return true;
  }

  // Catalogue model OR legacy listing at /cars/{slug} — LiveModelDetailView / CarDetailView have custom crumbs
  if (parts.length === 2 && parts[0] === "cars" && parts[1] !== "explore") {
    return true;
  }
  // Canonical catalogue model path at /cars/brand/{brandSlug}/{modelSlug}
  if (parts[0] === "cars" && parts[1] === "brand" && parts.length >= 4) {
    return true;
  }

  // Blog posts: ArticlePremium has title in trail
  if (parts[0] === "blog" && parts.length >= 2) {
    return true;
  }

  // Media articles (not hub pages like /media/reviews)
  if (parts[0] === "media" && parts.length >= 2) {
    if (parts.length === 2 && MEDIA_TWO_SEGMENT_HUBS.has(parts[1])) {
      return false;
    }
    if (parts.length >= 3 && parts[1] === "video") {
      return true;
    }
    if (parts.length === 2) {
      return true;
    }
  }

  return false;
}

/** Path segments that exist only for routing — omit as their own crumb (e.g. `/cars/brand/tata` → … Cars › Tata). */
const SKIP_STANDALONE_SEGMENT = new Set(["brand"]);

export function buildPathBreadcrumbs(pathname: string): Crumb[] {
  const path = pathname.split("?")[0] ?? pathname;
  const norm = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  if (norm === "" || norm === "/") {
    return [{ name: "Home" }];
  }

  const parts = norm.split("/").filter(Boolean);
  const items: Crumb[] = [{ name: "Home", href: "/" }];

  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]!;
    acc += `/${seg}`;
    const isLast = i === parts.length - 1;

    if (SKIP_STANDALONE_SEGMENT.has(seg.toLowerCase()) && !isLast) {
      continue;
    }

    const name = humanizeSlug(seg);
    if (isLast) {
      items.push({ name });
    } else {
      items.push({ name, href: acc });
    }
  }

  return items;
}
