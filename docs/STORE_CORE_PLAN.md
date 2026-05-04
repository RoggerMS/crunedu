# Store Core Plan (CrunEdu)

## Objective
Build the CrunEdu store as a **high-value MVP core** for student adoption and platform sustainability, while keeping implementation modular and leaving architecture ready for future marketplace expansion.

## Product principles
- **Now (MVP):** only CrunEdu publishes products.
- **Later (Marketplace):** allow external sellers to publish products using a controlled onboarding flow.
- Keep code simple, testable, and incremental.
- Visible UI copy in Spanish.
- No payments automation, no shipping integrations, no commissions in MVP.

## Phase 1 — Store MVP (CrunEdu-managed only)
### Functional scope
1. Public product feed with categories and search.
2. Product detail page with gallery, description, basic stock status.
3. Offer and promotion badges (manual, admin-defined).
4. "Me interesa" contact flow (WhatsApp/form/email routing).
5. Admin panel (internal) to create/edit/publish/archive products.
6. Basic analytics counters (views, clicks on interest button).

### Backend scope
- `GET /api/store/products`
- `GET /api/store/products/:id`
- `GET /api/store/categories`
- `POST /api/store/products` (JWT + admin role)
- `PATCH /api/store/products/:id` (JWT + admin role)
- `PATCH /api/store/products/:id/status` (JWT + admin role)

### Frontend scope
- `/app/tienda` (catalog)
- `/app/tienda/[slug]` (product detail)
- `/app/admin/tienda` (basic management)

## Phase 2 — Marketplace-ready foundation (still closed)
### Goal
Prepare internal architecture for future external sellers **without enabling open publishing yet**.

### Technical tasks
1. Add seller domain models with an initial `sellerType` enum (`CRUNEDU`, `EXTERNAL_FUTURE`).
2. Keep product ownership linked to a seller entity (CrunEdu account by default).
3. Add feature flags for future endpoints (`ENABLE_EXTERNAL_SELLERS`).
4. Keep external publish endpoints disabled by default.

## Phase 3 — Future external sellers (post-MVP)
- Seller onboarding request flow.
- Manual approval by CrunEdu admins.
- Seller dashboard.
- Moderation queue for product submissions.
- Policy checks and basic sanctions.

## Data model proposal (MVP-safe)
- `StoreCategory`
- `StoreProduct`
- `StoreProductImage`
- `StorePromotion`
- `StoreInterestLead`
- `StoreProductMetric`

> Note: schema changes should happen only when Phase 1 implementation starts, with non-destructive migrations.

## MVP acceptance criteria
- Students can browse many products and filter quickly.
- Every product has complete useful information.
- Admin can keep catalog updated daily.
- Promotions are visible and easy to manage.
- Architecture is explicitly prepared for marketplace evolution.

## Implementation order (recommended)
1. Database entities + seed catalog base.
2. Public read API endpoints.
3. Frontend catalog and detail pages.
4. Admin CRUD for products and promotions.
5. Interest-lead capture and metrics.
6. Feature-flag groundwork for external sellers.

## Risks and controls
- **Risk:** Scope explosion from "full marketplace" expectations.
  - **Control:** Phase gates and explicit post-MVP backlog.
- **Risk:** UX complexity.
  - **Control:** Start with simple listing/detail/admin pattern.
- **Risk:** Breaking current modules.
  - **Control:** Isolated `store` module and incremental validation.
