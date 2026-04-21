/**
 * Backend `entity_type` values for SEO routes (e.g. v1/seo/meta/&lt;entity_type&gt;/&lt;slug&gt;).
 * Override via env if your API uses different names (e.g. catalogue_model).
 */
export const SEO_ENTITY = {
  model: process.env.NEXT_PUBLIC_SEO_ENTITY_MODEL ?? "model",
  brand: process.env.NEXT_PUBLIC_SEO_ENTITY_BRAND ?? "brand",
  dealer: process.env.NEXT_PUBLIC_SEO_ENTITY_DEALER ?? "dealer",
  /** Static / CMS company pages when the API uses a separate type. */
  company: process.env.NEXT_PUBLIC_SEO_ENTITY_COMPANY ?? "company",
} as const;

export type SeoEntityKey = keyof typeof SEO_ENTITY;
