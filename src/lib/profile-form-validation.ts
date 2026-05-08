/**
 * Client-side rules aligned with Autolokate API {@link https://autolokate-api-staging-2j5tqz76xa-el.a.run.app/docs Swagger}
 * schema `UpdateProfileDto` (`/docs-json`). The OpenAPI spec does not publish
 * min/max length for most strings; we apply conservative limits to avoid 4xx surprises.
 */

export const VEHICLE_CATEGORIES = ["car", "bike", "scooter"] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export type ProfileFormFields = {
  full_name: string;
  phone: string;
  city_id: string;
  budget_min: string;
  budget_max: string;
  preferred_fuel_types: string;
  preferred_body_types: string;
  preferred_vehicle_category: string;
};

export type ProfileFieldKey = keyof ProfileFormFields;

export type ProfileValidationErrors = Partial<Record<ProfileFieldKey, string>>;

const IN_MOBILE = /^\+91[6-9]\d{9}$/;
const IN_MOBILE_LOOSE = /^\+91\d{10}$/;

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Slug-style tokens as in API examples: `petrol`, `electric`, `suv`, `hatchback`. */
const LIST_TOKEN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;

export const MAX_NAME = 120;
export const MAX_CITY_ID = 128;
const MAX_TOKEN_LEN = 32;
const MAX_LIST_ITEMS = 12;
const MAX_BUDGET = 9_999_999_999; // 4 digits under 1e10, keeps JSON number safe

function validateBudgetField(
  key: "budget_min" | "budget_max",
  raw: string,
  errors: ProfileValidationErrors
): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) {
    errors[key] = "Use a whole number in rupees (no decimals).";
    return null;
  }
  const n = Number(t);
  if (n < 0) {
    errors[key] = "Budget cannot be negative.";
    return null;
  }
  if (n > MAX_BUDGET) {
    errors[key] = `Must be at most ₹${MAX_BUDGET.toLocaleString("en-IN")}.`;
    return null;
  }
  return n;
}

export type ValidateProfileResult =
  | { ok: true; errors: ProfileValidationErrors; fuelPayload: string[] | null; bodyPayload: string[] | null }
  | { ok: false; errors: ProfileValidationErrors };

/**
 * Validates raw form strings before building the PATCH body.
 * On success, returns lowercase slug tokens for `preferred_*` arrays (see `UpdateProfileDto` examples).
 */
export function validateProfileForm(fields: ProfileFormFields): ValidateProfileResult {
  const errors: ProfileValidationErrors = {};

  const name = fields.full_name.trim();
  if (name.length > MAX_NAME) {
    errors.full_name = `Use at most ${MAX_NAME} characters.`;
  } else if (name.length === 1) {
    errors.full_name = "Enter at least 2 characters or leave blank.";
  }

  const phone = fields.phone.trim();
  if (phone) {
    const compact = phone.replace(/\s/g, "");
    if (!IN_MOBILE.test(compact) && !IN_MOBILE_LOOSE.test(compact)) {
      errors.phone = "Use a valid Indian number: +91 followed by 10 digits (e.g. +919876543210).";
    }
  }

  const city = fields.city_id.trim();
  if (city.length > MAX_CITY_ID) {
    errors.city_id = `Use at most ${MAX_CITY_ID} characters.`;
  }
  if (city && /[\r\n\t]/.test(fields.city_id)) {
    errors.city_id = "Remove line breaks from this field.";
  }

  const cat = fields.preferred_vehicle_category.trim().toLowerCase();
  if (cat && !VEHICLE_CATEGORIES.includes(cat as VehicleCategory)) {
    errors.preferred_vehicle_category = "Choose car, bike, or scooter (or clear the field).";
  }

  const minN = validateBudgetField("budget_min", fields.budget_min, errors);
  const maxN = validateBudgetField("budget_max", fields.budget_max, errors);
  if (minN != null && maxN != null && minN > maxN) {
    errors.budget_max = "Budget max must be greater than or equal to budget min.";
  }

  const fuels = parseCommaList(fields.preferred_fuel_types);
  if (fuels.length > MAX_LIST_ITEMS) {
    errors.preferred_fuel_types = `At most ${MAX_LIST_ITEMS} fuel types, comma-separated.`;
  } else {
    for (const f of fuels) {
      if (f.length > MAX_TOKEN_LEN) {
        errors.preferred_fuel_types = `Each fuel type must be at most ${MAX_TOKEN_LEN} characters.`;
        break;
      }
      if (!LIST_TOKEN.test(f)) {
        errors.preferred_fuel_types =
          "Use short names like petrol, diesel, cng, electric — letters, numbers, hyphen only.";
        break;
      }
    }
  }

  const bodies = parseCommaList(fields.preferred_body_types);
  if (bodies.length > MAX_LIST_ITEMS) {
    errors.preferred_body_types = `At most ${MAX_LIST_ITEMS} body types, comma-separated.`;
  } else {
    for (const b of bodies) {
      if (b.length > MAX_TOKEN_LEN) {
        errors.preferred_body_types = `Each body type must be at most ${MAX_TOKEN_LEN} characters.`;
        break;
      }
      if (!LIST_TOKEN.test(b)) {
        errors.preferred_body_types =
          "Use short names like suv, hatchback, sedan — letters, numbers, hyphen only.";
        break;
      }
    }
  }

  const ok = Object.keys(errors).length === 0;
  if (!ok) return { ok: false, errors };

  const normFuels = fuels.map((x) => x.toLowerCase());
  const normBodies = bodies.map((x) => x.toLowerCase());

  return {
    ok: true,
    errors,
    fuelPayload: normFuels.length ? normFuels : null,
    bodyPayload: normBodies.length ? normBodies : null,
  };
}
