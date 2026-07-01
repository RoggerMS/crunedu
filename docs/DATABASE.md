# Base de datos

El modelo principal está en:

```txt
packages/database/prisma/schema.prisma
```

## Grupos de tablas

1. Estructura académica: `universities`, `faculties`, `careers`.
2. Usuarios y perfiles: `users`, `profiles`, tokens de verificación y recuperación.
3. Comunidades: `communities`, `community_members`.
4. Contenido: `posts`, `questions`, `answers`, `documents`.
5. Etiquetas: `tags`, `post_tags`, `question_tags`, `document_tags`.
6. Interacciones: `comments`, `reactions`, `saved_posts`.
7. Tienda básica: `products`, `product_categories`, `product_images`, `product_favorites`, `product_inquiries`.
8. Moderación: `reports`, `moderation_logs`.
9. Notificaciones: `notifications`.

## Regla importante de reportes

La tabla `reports` tiene campos opcionales para varias entidades. El backend debe validar que un reporte apunte solo a una entidad a la vez.

## Dinero

Los precios usan `Decimal @db.Decimal(10, 2)`, no `Float`.

## Decisiones de rendimiento (MVP)

### 1) Queries frecuentes revisadas

- **Feed de posts**: `GET /api/posts` y `GET /api/communities/:id/posts` filtran por `status`, ordenan por `createdAt DESC, id DESC` y paginan por cursor.
- **Comentarios por post**: `GET /api/posts/:id/comments` filtra por `postId + status` y ordena por `createdAt ASC`.
- **Follows/followers**: listados de followers/following filtran por `followingId` o `followerId` y ordenan por `createdAt DESC`.
- **Búsqueda**: módulo search usa `contains` (ILIKE) sobre título/contenido para `posts`, `questions` y nombre/descripción de `communities`.

### 2) Índices añadidos y justificación

Se añadieron índices compuestos para rutas calientes de lectura:

- `Comment @@index([postId, status, createdAt])`
  - Mejora el patrón de lectura de comentarios por post con filtro de estado y orden temporal.
- `Follow @@index([followingId, createdAt(sort: Desc), followerId])`
  - Mejora listados de seguidores (`WHERE followingId = ? ORDER BY createdAt DESC`).
- `Follow @@index([followerId, createdAt(sort: Desc), followingId])`
  - Mejora listados de seguidos (`WHERE followerId = ? ORDER BY createdAt DESC`).

Además de `schema.prisma`, se creó migración SQL para aplicarlos en PostgreSQL.

### 3) Evitar `select *`

Para mantener payload y uso de CPU/IO bajos en el MVP, los servicios de API deben seguir usando `select` explícito en Prisma (sin `include` innecesario ni `select *`), devolviendo solo campos consumidos por la UI.

### 4) Caché de lecturas calientes

- **Feed inicial**: ya usa caché en memoria (`hot:feed:initial:*`) para primera carga sin cursor.
- **Comunidades populares**: ya usa caché en memoria (`hot:communities:popular`).
- TTL corto (20-30s) para equilibrio entre frescura y reducción de carga.

### 5) Notas sobre búsqueda

El patrón `contains`/ILIKE no usa bien índices B-Tree para subcadenas arbitrarias. Para escalar búsqueda en fases futuras:

- evaluar `pg_trgm` con GIN trigram indexes, o
- migrar a búsqueda full-text de PostgreSQL (`tsvector`) según comportamiento real de usuarios.

## Límites no controlados por Prisma

- Máximo 6 imágenes por producto.
- Tamaño máximo de archivos.
- Tipos de archivo permitidos.
- Regla exacta de reportes graves.

Eso se valida en backend.

## Admin module tables (20260701020000_admin_module)

- `admin_sessions`: sesiones administrativas temporales; guarda `token_hash`, `expires_at`, `last_used_at`, `revoked_at`, `ip_hash` y `user_agent_hash`. No guarda token completo, contraseña ni JWT.
- `admin_audit_logs`: auditoría central de acciones administrativas con `admin_user_id`, `action`, `module`, objetivo, motivo, `safe_before`, `safe_after`, `request_id` y hashes opcionales. No registra secretos.
- `promotions`: anuncios/promociones internas administradas por CrunEdu con estado, ubicación, prioridad, fechas, imagen y contadores básicos.
- `content_placements`: referencias ordenadas a contenido existente por área/slot; no duplica entidades.

Migración no destructiva: `packages/database/prisma/migrations/20260701020000_admin_module/migration.sql`.
