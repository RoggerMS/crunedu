# Store Core Plan (CrunEdu)

## Objective

Convertir la Tienda de CrunEdu en una experiencia universitaria funcional conectada al backend real, sin reemplazar la sección existente por una plantilla genérica.

La implementación actual usa los modelos `Product*` ya existentes y los extiende de forma aditiva para soportar catálogo real, publicaciones estudiantiles, imágenes, guardados, consultas, reportes, panel personal y administración básica.

## Estado actual — 2026-06-19

**Status:** In progress, con Fase 1 funcional implementada y pendiente de aplicar la migración localmente.

### Qué existía antes

- Namespace backend `/api/marketplace`.
- Categorías y productos básicos gestionados por CrunEdu.
- Detalle de producto con contador de vistas.
- Consultas con `contactName` y `contactPhone` manuales.
- Admin básico para productos, consultas y métricas.
- Frontend de Tienda con hooks y componentes propios, pero con acciones parcialmente simuladas.

### Fase 1 completada

- Catálogo real con búsqueda, filtros y orden desde backend.
- Categorías universitarias con slugs e icon keys.
- Publicación pública protegida por JWT.
- Edición, borrado lógico, publicar, pausar y marcar vendido para propietario/admin.
- Upload local de imágenes en `tmp/uploads/products` y servido por API.
- Tarjetas con imagen real o placeholder vectorial Lucide.
- Detalle con galería real y lightbox.
- Guardados reales con `ProductFavorite`.
- Reportes reales usando `Report.productId`.
- Contacto básico con `ProductInquiry` sin pedir nombre/celular obligatorios.
- Panel personal mínimo: publicaciones, guardados, consultas y estadísticas.
- Admin protegido por rol con productos, consultas, reportes y métricas.
- Seed actualizado con 10 categorías, 4 puntos seguros y 12 publicaciones universitarias.

## Endpoints implementados

### Catálogo público / viewer-aware

- `GET /api/marketplace/categories`
- `GET /api/marketplace/safe-points`
- `GET /api/marketplace/products`
- `GET /api/marketplace/products/:id`

`GET /api/marketplace/products` soporta:

- `q`
- `categoryId`
- `categorySlug`
- `type`
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

### Productos protegidos por JWT

- `POST /api/marketplace/products`
- `PATCH /api/marketplace/products/:id`
- `DELETE /api/marketplace/products/:id`
- `POST /api/marketplace/products/:id/publish`
- `POST /api/marketplace/products/:id/pause`
- `POST /api/marketplace/products/:id/mark-sold`

### Imágenes

- `POST /api/marketplace/products/images`
- `POST /api/marketplace/products/:id/images`
- `PATCH /api/marketplace/products/:id/images/order`
- `DELETE /api/marketplace/products/:id/images/:imageId`
- `POST /api/marketplace/products/:id/images/:imageId/cover`
- `GET /api/marketplace/products/images/:filename`

### Interacción

- `POST /api/marketplace/products/:id/favorite`
- `GET /api/marketplace/me/favorites`
- `POST /api/marketplace/products/:id/inquiries`
- `GET /api/marketplace/me/inquiries`
- `POST /api/marketplace/products/:id/reports`

### Panel personal

- `GET /api/marketplace/me/listings`
- `GET /api/marketplace/me/statistics`

### Admin

- `GET /api/marketplace/admin/products`
- `POST /api/marketplace/admin/products`
- `PATCH /api/marketplace/admin/products/:id/status`
- `GET /api/marketplace/admin/inquiries`
- `POST /api/marketplace/admin/inquiries/:id/status`
- `GET /api/marketplace/admin/reports`
- `GET /api/marketplace/admin/metrics`

## Modelos y migración

Migración pendiente de aplicar localmente:

- `packages/database/prisma/migrations/20260619190000_store_functional_v1/migration.sql`

Cambios principales:

- Enums nuevos: `ProductType`, `ProductPriceType`, `ProductCondition`, `ProductDeliveryType`.
- `Product` extendido con tipo, tipo de precio, negociación, condición, entrega, campus, distrito, punto seguro, curso, marca, modelo, cantidad, contador de favoritos, `publishedAt` y `deletedAt`.
- `ProductImage` extendido con MIME, tamaño, alt text e indicador de portada.
- `ProductCategory` extendido con `icon`, `order` e `isActive`.
- `ProductInquiry` permite `contactName` y `contactPhone` nulos, agrega `quickMessageType` y default `chat`.
- Nuevo `ProductSafePoint`.
- `Report.productId` se reutiliza para reportes de producto.

## Storage de imágenes

- La implementación actual usa filesystem local como fallback de desarrollo: `tmp/uploads/products`.
- No se guardan binarios en PostgreSQL.
- Se validan MIME types permitidos (`JPEG`, `PNG`, `WEBP`) y tamaño máximo de 5 MB.
- MinIO queda pendiente como adapter configurable si se conectan variables y cliente de storage en una fase posterior.

## Frontend implementado

- `/app/tienda`: catálogo con búsqueda, filtros URL-synced, grid y panel personal.
- `/app/tienda/[id]`: detalle con galería, acciones reales, contacto, guardado y reporte.
- `/app/tienda/nuevo`: publicación funcional con upload, preview, guardar borrador y publicar.
- `/app/admin/tienda`: panel admin con gating por rol.

## Validación ejecutada en Codex

- `DATABASE_URL='postgresql://user:pass@localhost:5432/crunedu?schema=public' npm run db:validate`
- `DATABASE_URL='postgresql://user:pass@localhost:5432/crunedu?schema=public' npm run db:generate`
- `npm run build -w @crunedu/shared`
- `npm run build -w @crunedu/api`
- `npm run build -w @crunedu/web`

`npm run db:validate` sin `DATABASE_URL` falla en Codex porque la variable no está definida; con URL dummy de validación el schema es válido.

## Verificación local recomendada

```powershell
cd C:\GITHUB\crunedu
npm run db:migrate
npm run db:seed
docker compose up -d --build api
docker compose up -d --build web
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4000/api/marketplace/categories
Invoke-RestMethod http://localhost:4000/api/marketplace/products
Invoke-RestMethod http://localhost:4000/api/marketplace/products?q=calculadora
Invoke-RestMethod http://localhost:4000/api/marketplace/safe-points
```

## Pendientes por fase

### Fase 2 — Conversaciones y reservas

- Conversación interna por producto, comprador y vendedor.
- Bandeja de conversaciones.
- Mensajes rápidos persistidos.
- Solicitud, aceptación, rechazo y cancelación de reservas.
- Estado reservado sin conflictos.

### Fase 3 — Transacciones, reseñas y reputación

- Transacción/completado comprador-vendedor.
- Reseñas posteriores a operación.
- Reputación del vendedor.
- Perfil comercial.

### Fase 4 — Admin avanzado

- CRUD admin de categorías.
- CRUD admin de puntos seguros.
- Moderation logs específicos de tienda.
- Métricas avanzadas y dashboard operacional.

## Riesgos / notas

- Ejecutar la migración local es obligatorio antes de probar runtime.
- `ProductStatus` conserva los estados existentes (`DRAFT`, `ACTIVE`, `HIDDEN`, `SOLD_OUT`, `DELETED`) para evitar una migración enum más riesgosa.
- No se implementaron pagos, shipping, comisiones ni chat completo.
- No se muestran botones falsos para funcionalidades no implementadas.
