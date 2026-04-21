import type { Company } from "./types";
import companiesJson from "./json/companies.json";

export const companies = companiesJson as Company[];
