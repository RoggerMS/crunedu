# Plan módulo Apuntes — Backend real + Frontend real (2026-06-19)

Alta: 2026-06-19. Estado: implementado (pendiente verificación runtime local con Docker).

## Objetivo

Convertir Apuntes de maqueta estática en un módulo funcional: listar apuntes reales,
subir archivos reales, ver detalle, descargar, guardar, compartir, valorar con estrellas
dentro del detalle, reportar, filtrar por curso/tipo/material, conectar con comunidades y
mostrar actividad de apuntes compartidos en Inicio/feed.

## Schema (Prisma)

Cambios aditivos y seguros (no destructivos):

- Enum `DocumentVisibility { PUBLIC, COMMUNITY, PRIVATE }`.
- `Document`: `visibility`, `materialType`, `originalName`, `mimeType`, `downloadsCount`, `viewsCount` + relaciones `posts`, `savedBy`, `ratings`.
- `Post`: `documentId` (opcional) + relación `document` (integración feed).
- Modelos nuevos: `SavedDocument` (documentId, userId), `DocumentRating` (id, documentId, userId, value 1-5, @@unique).
- Relaciones agregadas a `User`: `savedDocuments`, `documentRatings`.

> Migración: el usuario debe crearla localmente con `npm run db:migrate -- --name apuntes_module`
> (cambios aditivos, no resetea datos). `prisma validate` y `prisma generate` ya validados.

## Backend implementado (apps/api, módulo `documents`, controlador `apuntes`)

Endpoints:

- `GET /api/apuntes` — listado con filtros: `q, course, materialType, fileType, communityId,
  visibility, saved, mine, sort (recent | most_saved | most_downloaded | best_rated), cursor, limit`.
  Respuesta `{ items, nextCursor }`. Respeta visibilidad (público / comunidad para miembros / privado para autor).
- `GET /api/apuntes/contributors` — top colaboradores por apuntes públicos (sin datos sensibles).
- `GET /api/apuntes/:id` — detalle real con `stats`, `rating { average, count, viewerRating }`, `viewerState { saved, isMine, canEdit, canDelete, canReport }`.
- `POST /api/apuntes/files` (JWT, multipart `file`) — upload real con validación por extensión + MIME y límites por tipo (PDF 20MB, Word 15MB, Imagen 8MB, ZIP 25MB, PPT 25MB, Excel 15MB).
- `GET /api/apuntes/files/:filename` — sirve archivo inline (nombre aleatorio, anti path traversal).
- `GET /api/apuntes/:id/download` — descarga con `Content-Disposition: attachment`, verifica permisos y suma `downloadsCount`.
- `POST /api/apuntes` (JWT) — crea apunte con metadata + `uploadedFile`. Si tiene `communityId` y visibilidad no privada, crea automáticamente un `Post` (con `documentId`) en esa comunidad.
- `PATCH /api/apuntes/:id` (JWT, autor/admin) — editar metadata.
- `DELETE /api/apuntes/:id` (JWT, autor/admin) — soft delete (`status = DELETED`).
- `POST /api/apuntes/:id/save` / `DELETE /api/apuntes/:id/save` (JWT) — guardar/quitar guardado real.
- `POST /api/apuntes/:id/rating` (JWT, value 1-5) — valorar/actualizar valoración.

Reportes: `ReportTargetType` ahora incluye `DOCUMENT`; `ReportsService` valida documento,
crea reporte con `documentId`, resuelve dueño y actualiza estado (soft hide).

Feed: `PostsService` ahora incluye `document` en la respuesta del post cuando `documentId`
está presente; `FeedPost` (shared) tiene campo `document`.

## Frontend implementado (apps/web)

- `lib/api-helpers.ts`: helpers `getNotes, getNoteById, getNoteContributors, uploadNoteFile,
  createNote, updateNote, deleteNote, saveNote, unsaveNote, rateNote, buildNoteDownloadUrl,
  buildNoteFileUrl`; `createReport` ahora acepta `DOCUMENT`.
- `hooks/useNotes.ts`: reemplaza `noteSeed` por backend real; acciones reales (publicar,
  guardar, valorar, eliminar, compartir, descargar) con updates optimistas y rollback.
- Tipos (`components/notes/types.ts`): `NoteItem` alineado al backend; constantes `NOTE_COURSES`,
  `NOTE_MATERIAL_TYPES`, `NOTE_FILE_TYPES`.
- Página `/app/apuntes`: layout 3 columnas (rail izquierdo de cursos/material/archivo,
  centro header+buscador+orden+listado, derecha tips+destacados+top colaboradores reales).
  Sin estadísticas falsas. Filtros reales vía query al backend.
- `NoteCard`: promedio de estrellas + contador (sin valorar desde la card), menú tres puntitos
  funcional (copiar enlace, reportar, editar, eliminar).
- `NoteDetail`: valoración 1-5 aquí, guardar, compartir, reportar, descargar, editar/eliminar.
- `CreateNoteModal` + página `/app/apuntes/nuevo`: flujo real (upload → create), visibilidad
  público/comunidad/privado, curso opcional dentro de "Más opciones".
- `NoteUploadDropzone` (drag & drop con validación client-side), `NoteVisibilitySelector`,
  `NoteFiltersRail`, `DocumentFileIcon`, `NoteFilePreview`, `NoteMenu`, `DocumentAttachmentCard`.
- Detalle `/app/apuntes/[id]`: fetch real, relacionados reales, todas las acciones conectadas.
- `note-data.ts`: `noteSeed` vacío (solo referencia); ya no es fuente de datos.

## Integración Comunidad + Inicio/feed

- Comunidad (`/app/comunidades/[id]`): pestaña "Archivos" ahora carga apuntes reales de la
  comunidad (`GET /api/apuntes?communityId=X`) y botón "Compartir apunte" que abre
  `/app/apuntes/nuevo?communityId=X`.
- Inicio/feed: al compartir un apunte en comunidad se crea un `Post` con `documentId`; el feed
  lo mapea a `sharedEntity` tipo `note` y renderiza `DocumentAttachmentCard` ("Ver apunte").
- Inicio NO permite subir archivos directamente (solo desde Apuntes/Comunidad).

## Validación ejecutada (estática)

- `npm run db:validate` ✓
- `npm run db:generate` ✓
- `npm run build -w @crunedu/shared` ✓
- `npm run build -w @crunedu/api` ✓
- `npm run build -w @crunedu/web` ✓ (solo warnings preexistentes: `<img>`, exhaustive-deps)

## Pendientes / Riesgos

- Migración Prisma debe crearse/aplicarse localmente (`npm run db:migrate -- --name apuntes_module`).
- `best_rated` y `most_saved` se ordenan en memoria (lote de 60) sin cursor real (nextCursor null).
- El endpoint `files/:filename` sirve el archivo por nombre aleatorio sin auth (igual que imágenes
  de posts/preguntas); la descarga controlada `:id/download` sí valida permisos.
- No se invalida el cache `hot:feed:initial` al crear el post automático desde Apuntes (TTL 20s).
- Comentarios en apuntes, preview embebido de PDF, historial de versiones y borradores: diferidos.
- Edición desde el detalle usa `prompt()` (MVP); edición rica puede agregarse después.
