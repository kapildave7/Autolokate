/** Default search & discovery constants — swap with API-driven config later. */

export const POPULAR_SEARCHES = [
  "SUV under 20 lakh",
  "Electric SUV",
  "Hyundai Creta",
  "7 seater diesel",
  "BMW 3 Series",
  "Long range EV",
];

export const AI_SUGGESTIONS = [
  {
    label: "Compare popular SUVs",
    query: "/compare",
  },
  { label: "Expert reviews & tests", query: "/media/reviews" },
  { label: "Side-by-side comparisons", query: "/media/comparison" },
  { label: "Buying guides", query: "/media/news" },
];

export const DEFAULT_LOAN_RATE = 9.8;
export const TOKEN_AMOUNT_PCT = 2.5;

/** Autolokate AI — monthly access pass (INR, VAT-inclusive messaging on UI) */
export const AI_ACCESS_MONTHLY_INR = 29;
export const AI_ACCESS_PERIOD_DAYS = 30;

export const TEST_DRIVE_SLOTS = ["10:00 AM", "12:00 PM", "3:00 PM", "5:30 PM"];

export const SUBSCRIPTION_PLANS = [
  { id: "flex", name: "Flex 12", months: 12, km: "15k/yr", monthlyFrom: 24999, highlight: false },
  { id: "plus", name: "Plus 24", months: 24, km: "20k/yr", monthlyFrom: 21999, highlight: true },
  { id: "pro", name: "Pro 36", months: 36, km: "25k/yr", monthlyFrom: 19999, highlight: false },
] as const;
