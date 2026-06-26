# Momentos Plan (MVP)

## Objetivo
Convertir **Momentos** en un feed simple y útil donde cualquier estudiante pueda compartir contexto universitario rápido, con opción de imagen y punto de entrada a contenido relacionado.

## Estado: Implementado (backend + frontend persistentes)

### Base de datos
- Modelos: `Moment`, `MomentMedia`, `MomentTag`, `MomentTagAssignment`, `MomentBoost`, `MomentConfirmation`, `SavedMoment`, `MomentComment`.
- Enum `MomentType` (NOW, ALERT, FOOD, HUMOR, EVENT, CAMPUS, COMMUNITY, LOST_FOUND).
- Restricciones `@@unique` para un impulso/confirmación/guardado por usuario.
- Índices en autor, estado, creación, expiración, tipo, ubicación.
- Relación con `Report` (`momentId`) y `User`.
- Migración `20260626120000_moments_module`.
- Seed idempotente con 6 momentos de ejemplo + usuarios demo.

### Backend (`apps/api/src/modules/moments/`)
- Endpoints: list, detail, create, update, delete, media upload/serve, boost/unboost, confirm/unconfirm, save/unsave, share, comments (GET/POST/DELETE), news, gallery, saved, trends, topics.
- `OptionalJwtAuthGuard` en lecturas públicas, `JwtAuthGuard` en escrituras.
- `RateLimit` en crear, comentar, impulsar y subir medios.
- Paginación por cursor, `_count` (sin desincronización), transacciones, relevancia en backend, expiración controlada.
- Validación con class-validator, sanitización de archivos, permisos de autor/moderador/admin.

### Frontend
- Capa API tipada (`lib/moments-api.ts`) con `apiRequest`.
- `useMoments` refactorizado: carga real, loading/error/reintento, actualizaciones optimistas con rollback, comentarios, fallback solo en desarrollo.
- 5 vistas conectadas: Momentos, Noticias, Galería, Guardados, Tendencias.
- Creación funcional (modal + página `/crear`) con `MomentForm` compartido.
- Detalle `/app/momentos/[id]` con API real e interacciones.
- Skeletons, estados vacíos, error con reintento, toasts, prevención de doble envío.
- Datos estáticos (`moments-data.ts`) conservados como seed/fallback de desarrollo.

## Datos estáticos conservados
- `apps/web/src/components/moments/moments-data.ts` se mantiene.
- `fallbackMoments` y `fallbackNews` se usan únicamente en modo desarrollo cuando la API falla, o como datos de referencia.

## Pruebas
- `apps/api/src/tests/moments.smoke.ts` (script `npm run test:moments -w @crunedu/api`): cubre crear, validar, listar, detalle, permisos, impulso único, desimpulsar, confirmación, guardar, comentar, eliminar comentario, news/gallery/trends/topics, subida inválida, momento inexistente.

## Pendiente / Notas
- Aplicar migración y seed localmente con Docker (ver pasos en AGENTS.md).
- Video (MP4/WEBM) habilitado con límite 25MB; el almacenamiento es local en desarrollo, preparado para MinIO.
