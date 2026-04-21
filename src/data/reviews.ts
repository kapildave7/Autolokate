import type { PlatformReview } from "./types";
import reviewsJson from "./json/reviews.json";

export const platformReviews = reviewsJson as PlatformReview[];

export function getReviewsForCompany(companyId: string, limit = 120): PlatformReview[] {
  return platformReviews.filter((r) => r.companyId === companyId).slice(0, limit);
}
