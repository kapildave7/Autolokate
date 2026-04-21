/** Payload from GET /v1/legal/* (privacy-policy, terms, refund-policy). */
export type LegalDocument = {
  title: string;
  version: string;
  effective_date: string;
  content: string;
};
