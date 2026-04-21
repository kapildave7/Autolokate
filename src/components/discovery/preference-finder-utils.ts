import type { AdvisorStep } from "@/lib/client/advisor-api";

export type PreferenceFinderAnswerEntry = {
  step_id: string;
  selected_option_ids: string[];
  /** Same order as selected_option_ids; set when the user selects in-app */
  display_labels?: string[];
};

/** Known slug prefixes we strip so the line reads like a choice, not an id. */
const OPTION_CATEGORY_PREFIXES = new Set([
  "budget",
  "fuel",
  "use",
  "feat",
  "family",
  "body",
  "city",
  "must",
  "vehicle",
  "seat",
  "transmission",
  "drive",
  "range",
  "priority",
]);

const TOKEN_LABELS: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  cng: "CNG",
  lpg: "LPG",
  daily: "Daily",
  commute: "commute",
  weekend: "Weekend",
  highway: "highway",
  trips: "trips",
  under: "Under",
  over: "Over",
  between: "Between",
  automatic: "Automatic transmission",
  manual: "Manual transmission",
  amt: "AMT",
  sunroof: "Sunroof",
  cruise: "Cruise control",
  leather: "Leather seats",
  touchscreen: "Touchscreen",
  camera: "Camera",
  parking: "Parking sensors",
};

export function formatStepLabel(stepId: string): string {
  return stepId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Converts API-style option ids (e.g. budget_under_5, fuel_petrol) into short,
 * readable copy when we do not have the step's option list (e.g. cold load).
 */
export function humanizeOptionId(id: string): string {
  const raw = id.trim();
  if (!raw) return "—";

  const parts = raw.split("_").filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0].toLowerCase();
    return TOKEN_LABELS[w] ?? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }

  let start = 0;
  if (OPTION_CATEGORY_PREFIXES.has(parts[0].toLowerCase())) start = 1;
  const rest = parts.slice(start);
  if (rest.length === 0) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  }

  // Budget bands: under_5 → Under ₹5 lakh
  if (rest[0]?.toLowerCase() === "under" && rest[1] && /^\d+(\.\d+)?$/.test(rest[1])) {
    return `Under ₹${rest[1]} lakh`;
  }
  if (rest[0]?.toLowerCase() === "over" && rest[1] && /^\d+(\.\d+)?$/.test(rest[1])) {
    return `Over ₹${rest[1]} lakh`;
  }

  // Family size: lone digit
  if (rest.length === 1 && /^\d+$/.test(rest[0])) {
    const n = rest[0];
    return n === "1" ? "1 person" : `Up to ${n} people`;
  }

  const words = rest.map((word) => {
    const w = word.toLowerCase();
    if (/^\d+(\.\d+)?$/.test(word)) return word;
    return TOKEN_LABELS[w] ?? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  let line = words.join(" ");
  line = line.replace(/\bDaily commute\b/i, "Daily commute");
  line = line.replace(/\bWeekend highway trips\b/i, "Weekend highway trips");
  return line;
}

/** Map every selected id to a label using step options when available. */
export function formatAnswerDisplay(selectedIds: string[], step?: AdvisorStep): string {
  if (!selectedIds.length) return "—";
  const byId = new Map((step?.options ?? []).map((o) => [o.id, o.label.trim()]));
  const labels = selectedIds.map((id) => {
    const fromApi = byId.get(id);
    if (fromApi) return fromApi;
    return humanizeOptionId(id);
  });
  return labels.join(" · ");
}

export function entryDisplayLine(entry: PreferenceFinderAnswerEntry, step?: AdvisorStep): string {
  const ids = entry.selected_option_ids;
  if (!ids.length) return "—";
  if (
    entry.display_labels &&
    entry.display_labels.length === ids.length &&
    entry.display_labels.every((s) => s.trim().length > 0)
  ) {
    return entry.display_labels.map((s) => s.trim()).join(" · ");
  }
  return formatAnswerDisplay(ids, step);
}
