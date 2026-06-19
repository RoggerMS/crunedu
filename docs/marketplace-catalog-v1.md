# Marketplace Catalog V1

## Status

Implemented as Store Functional V1 on 2026-06-19. Runtime verification must be completed locally after applying the Prisma migration.

## Goal

Provide a real university marketplace catalog for CrunEdu using the existing `Product*` models and `/api/marketplace` namespace.

## Catalog API

### `GET /api/marketplace/products`

Returns:

```json
{
  "items": [],
  "featuredProducts": [],
  "nextCursor": null,
  "filters": {}
}
```

Supported query params:

- `q`
- `categoryId`
- `categorySlug`
- `type`
- `status`
- `condition`
- `deliveryType`
- `priceMin`
- `priceMax`
- `campus`
- `safePointId`
- `sellerId`
- `saved`
- `mine`
- `sort`
- `cursor`
- `limit`

Supported `sort` values:

- `relevance`
- `recent`
- `low_price`
- `high_price`
- `most_viewed`
- `most_saved`
- `verified`
- `campus`

### Viewer state

When an optional JWT is provided, products include:

- `viewerState.saved`
- `viewerState.isMine`
- `viewerState.canEdit`
- `viewerState.canDelete`
- `viewerState.canReport`

## Product response highlights

Each product maps backend fields into a frontend-friendly store item:

- `type`
- `priceType`
- `condition`
- `deliveryType`
- `images`
- `seller`
- `safePoint`
- `stats.views`
- `stats.saves`
- `stats.contacts`
- `viewerState`

## Functional flows completed

- Browse products.
- Search from backend.
- Filter by category/type/delivery and URL query params.
- View detail with real images.
- Publish as authenticated user.
- Upload images.
- Save/unsave product.
- Contact seller via inquiry without manual phone/name.
- Report product.
- Manage own listings through panel.
- Admin product/inquiry/report/metrics review.

## Storage

- Current storage: local filesystem fallback under `tmp/uploads/products`.
- Public serving route: `GET /api/marketplace/products/images/:filename`.
- MIME types: JPG/JPEG, PNG, WEBP.
- Max image size: 5 MB.
- Max images per product: 6.
- MinIO adapter remains pending.

## Local testing

```powershell
cd C:\GITHUB\crunedu
npm run db:migrate
npm run db:seed
docker compose up -d --build api
docker compose up -d --build web
Invoke-RestMethod http://localhost:4000/api/marketplace/categories
Invoke-RestMethod http://localhost:4000/api/marketplace/products
Invoke-RestMethod http://localhost:4000/api/marketplace/products?q=calculadora
```

## Next phase

- Conversations.
- Reservations.
- Transaction completion.
- Reviews and reputation.
- Admin CRUD for safe points and categories.
