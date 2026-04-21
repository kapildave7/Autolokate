export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";
export type Transmission = "Manual" | "Automatic" | "CVT" | "DCT" | "e-CVT";
export type SellerType = "Dealer" | "Individual";

export interface Company {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  established: string;
  bannerImage: string;
  logoLetter: string;
  verified: boolean;
  dealerReviews: DealerReview[];
}

export interface DealerReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CarReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface PriceHistoryPoint {
  month: string;
  price: number;
}

export interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
}

export interface ServiceRecord {
  date: string;
  label: string;
  kms: number;
}

export interface InspectionItem {
  category: string;
  score: number;
  maxScore: number;
  status: "pass" | "attention";
}

export interface Car {
  id: string;
  companyId: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  /** Pre-discount list price for deal badges */
  listPrice: number;
  /** 0–100 discount vs list */
  discountPercent: number;
  fuel: FuelType;
  transmission: Transmission;
  kms: number;
  owners: number;
  city: string;
  sellerType: SellerType;
  exteriorColor: string;
  images: string[];
  engine: string;
  power: string;
  torque: string;
  mileage: string;
  bodyType: string;
  features: string[];
  specs: Record<string, string>;
  certified: boolean;
  isNew: boolean;
  trending: boolean;
  addedAt: string;
  reviews: CarReview[];
  /** Default EMI at default rate for filter/sort */
  estimatedEmiMonthly: number;
  priceHistory: PriceHistoryPoint[];
  videoTitle: string;
  inspectionReport: InspectionItem[];
  ownershipTimeline: TimelineEvent[];
  serviceTimeline: ServiceRecord[];
  pros: string[];
  cons: string[];
  whyBuy: string[];
  /** 0–100 eco score */
  carbonScore: number;
  /** Seed for deterministic “AI match” UI */
  matchProfileKey: string;
}

export interface Bike {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  engineCc: number;
  mileageKmpl: number;
  city: string;
  fuel: "Petrol" | "Electric";
  bodyType: "Commuter" | "Sports" | "Cruiser" | "Scooter" | "Adventure" | "Naked";
  image: string;
  videoSlug?: string;
  videoSlugs?: string[];
  colors?: string[];
  gallery?: string[];
  keyFeatures?: string[];
  pros: string[];
  cons: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readMins: number;
  publishedAt: string;
  coverImage: string;
  tags: string[];
  trending?: boolean;
  featured?: boolean;
  videoUrl?: string;
}

export type ArticleSectionType = "p" | "h2" | "h3";

export interface ArticleSection {
  type: ArticleSectionType;
  text: string;
}

export interface ArticleTocItem {
  id: string;
  label: string;
}

export interface ArticleDoc extends BlogPost {
  sections: ArticleSection[];
  toc: ArticleTocItem[];
  relatedSlugs: string[];
  inlineImages?: { src: string; caption: string; alt: string }[];
}

export interface MediaVideo {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  durationSec: number;
  brandTag: string;
  category: string;
  embedUrl: string;
  publishedAt: string;
  trending: boolean;
  views: number;
  /** Present when clips are sourced from a specific YouTube channel (e.g. Indian Drive Guide). */
  sourceChannel?: string;
  sourceChannelUrl?: string;
}

export interface PlatformReview {
  id: string;
  carId: string;
  companyId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
}

export interface ChatThread {
  id: string;
  name: string;
  last: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}
