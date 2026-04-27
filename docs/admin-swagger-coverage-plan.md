# Admin and User API Coverage Plan

Source of truth: Swagger docs at `https://autolokate-api-staging-2j5tqz76xa-el.a.run.app/docs`

This file is a living checklist to ensure no endpoint or key is missed while restructuring admin and user flows.

## 1) Coverage Status (Current Pass)

### Auth
- [x] `POST /v1/auth/login/otp`
- [x] `POST /v1/auth/verify-otp`
- [x] `POST /v1/auth/logout`
- [x] `GET /v1/auth/me`
- [x] `PATCH /v1/auth/me` (onboarding/profile update)
- [x] `GET /v1/auth/me/export`
- [x] `DELETE /v1/auth/me`
- [x] `POST /v1/auth/refresh` (explicit public client wrapper)

### Admin / Users
- [x] list/detail/delete/role-update endpoints wired

### Admin / Catalogue
- [x] bulk import
- [x] patch model

### Admin / Reviews
- [x] model reviews create/list/update/delete/status
- [x] variant reviews create/list/update/delete/status

### Admin / Dashboard
- [x] stats
- [x] users list
- [x] cursor/limit query support wired in dashboard users list flow

### Admin / Pricing
- [x] list/create/update/deactivate

### Admin / Payments
- [x] list
- [x] refund
- [x] pagination params support in client list function
- [x] list UI wired to backend `page`/`limit`

### Admin / Bookings
- [x] list
- [x] update
- [x] pagination params support in client list function
- [x] list UI wired to backend `page`/`limit`

### Admin / Scraper
- [x] enrich trigger
- [x] manual run trigger
- [x] list runs
- [x] run detail
- [x] run logs
- [x] runs list supports configurable backend `limit`

### Admin / SEO
- [x] metadata/faqs/redirects CRUD endpoints wired
- [x] health endpoint wired
- [x] public SEO preview endpoints wired in admin UI

### Admin / Support
- [x] grievances list

### Admin / Pipeline
- [x] rollback
- [x] revisions/rejected/health/coverage/gaps/freshness/anomalies
- [x] acknowledge anomaly
- [x] kill switches list/toggle
- [x] field overrides list/create/update/delete
- [x] query-param support added for list endpoints (`limit`, anomaly filters, field override filters)

### User-Side Domain APIs
- [x] catalogue endpoints
- [x] advisor core flow
- [x] booking/payment flow
- [x] prices/taxonomy/dealers/support/legal/seo
- [x] advisor archive/action endpoints added in client
- [x] advisor reset flow archives previous conversation before starting a new one

## 2) Restructure Standards (To Enforce Across All Admin Modules)

- List pages:
  - unified table shell
  - search and pagination
  - action order: `Inspect`, `View`, `Edit`
- Detail pages:
  - full response-keys section
  - structured nested value rendering (no raw JSON blobs)
  - image previews for image-like keys
  - mode-aware controls (`view` / `edit`)
- Forms:
  - structured fields, no raw JSON textareas for normal operations
  - inline validation and typed payload shaping
- Upload/import:
  - clear schema helper text
  - dry validation before API call where possible

## 3) Next Execution Order

1. Audit all admin list screens for true backend pagination usage where Swagger supports it.
2. Run strict endpoint/key completeness sweep on remaining user-side flows (advisor/dealers/legal/health pages).
3. Run a strict field-completeness sweep for user-facing detail pages (cars, compare, advisor results) to match API keys.
4. Add a central "API completeness smoke test" checklist for manual QA (route-by-route).

