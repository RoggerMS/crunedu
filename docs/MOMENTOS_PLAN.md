# Momentos Plan (MVP)

## Objetivo
Convertir **Momentos** en un feed simple y útil donde cualquier estudiante pueda compartir contexto universitario rápido, con opción de imagen y punto de entrada a contenido relacionado.

## Estado: Arquitectura canónica implementada (Feed + Momentos unificados)

### Publicación canónica
- `Post` es la publicación canónica (contenido, medios, Me gusta, comentarios, guardados, compartidos, vistas).
- `Moment` es una **ubicación** (placement) en Momentos que referencia un `Post` vía `postId`.
- Interacciones compartidas: Me gusta (`Reaction`), comentarios (`Comment`), guardados (`SavedPost`), medios (`PostImage`) viven en el `Post`.
- `MomentConfirmation` es específica de la ubicación en Momentos (no aparece en el Feed).
- Un momento puede existir solo en Momentos (`inFeed=false`), solo en Feed, o en ambos (`inFeed=true`).

### Impulsar → Me gusta
- `MomentBoost` quedó deprecado; los impulsos existentes se migraron a `Reaction` (type `LIKE`).
- Endpoints: `POST/DELETE /api/moments/:id/like` y `POST/DELETE /api/posts/:id/like`.
- Un solo Me gusta por usuario y publicación, sincronizado entre Feed y Momentos.

### Confirmar
- Permanece solo en Momentos y detalle. Check simple (no escudo). Idempotente (pulsar de nuevo retira).

### Expiración y permanencia
- `expiresAt` nullable + `isPermanent` boolean.
- Opciones: 1h, 6h, 12h, 24h, 3 días, 7 días, Siempre.
- Momentos expirados desaparecen del descubrimiento público pero se conservan en guardados y archivo del autor.

### Noticias
- `GET /api/moments/news` (listado) y `GET /api/moments/news/:id` (detalle con momentos relacionados).
- Ruta frontend `/app/momentos/noticias/[id]`.

### Preferencia de visualización
- Selector inicial: "Ver uno por uno" vs "Explorar en tarjetas".
- Persistencia en `localStorage` (`crunedu_moments_view_mode`). No reaparece en cada visita.

### Navegación
- Flechas ← → del teclado en vista uno por uno (no activa al escribir o con modal abierto).
- Botones táctiles anterior/siguiente conservados.

### Fallback
- Eliminado el fallback automático por `NODE_ENV`. Ahora se controla con `NEXT_PUBLIC_MOMENTS_USE_FALLBACK` (default false).

### Datos estáticos conservados
- `moments-data.ts` se mantiene como datos de prueba; solo se usa con `NEXT_PUBLIC_MOMENTS_USE_FALLBACK=true`.

## Migraciones
- `20260626120000_moments_module` (schema momentos original)
- `20260627000000_canonical_post_moment_link` (Post canónico + link Moment→Post + backfill boosts→likes)

## Pruebas
- `apps/api/src/tests/moments.smoke.ts` (script `npm run test:moments -w @crunedu/api`): cubre crear, validar, listar, detalle, Me gusta idempotente, quitar like, confirmar idempotente, guardar, comentar, compartir, compartir-al-Feed (solo autor), permanent, news detail, permisos, subida inválida.

## Pendiente / Notas
- Aplicar migraciones y seed localmente con Docker.
- QA runtime con Docker (este entorno no tiene PostgreSQL disponible).
