/** Normalized dealer row from GET /v1/dealers or embedded in detail. */
export type DealerRow = {
  id: string;
  partner_type: string | null;
  name: string;
  city_id: string | null;
  address: string | null;
  location: unknown;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  metadata: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type DealerReviewRow = {
  id: string;
  partner_id: string;
  user_id: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string | null;
};

export type DealerDetailPayload = {
  dealer: DealerRow;
  reviews: DealerReviewRow[];
};
