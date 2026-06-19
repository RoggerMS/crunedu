# Actualización módulo de Apuntes (2026-05-01)

## Alcance implementado

- Modelo mínimo de apunte sobre `Document`: título, descripción, curso, ciclo opcional, URL de archivo, autor y fecha.
- Endpoints dedicados para apuntes:
  - `GET /api/apuntes`
  - `POST /api/apuntes` (JWT requerido)
- Pantalla `/app/apuntes` conectada a API con:
  - formulario para publicar,
  - listado de apuntes,
  - filtros por curso y ciclo,
  - sección "Destacados" separada del feed general.
- Mensajería y validaciones visibles en español.

## Notas técnicas

- Se reutilizó el modelo `Document` existente para evitar crear una tabla nueva innecesaria.
- Se agregó `course` y `cycle` al modelo Prisma `Document` para soportar filtros del módulo.
- Para el MVP, el campo de archivo se maneja como URL (`fileUrl`) con validación simple `http/https`.

## Actualización 2026-06-19 — Apuntes funcional (backend + frontend real)

El módulo dejó de ser estático. Ver `docs/APUNTES_MODULE_PLAN.md` para el detalle completo.

- Schema: `DocumentVisibility`, `SavedDocument`, `DocumentRating`, `Post.documentId`, contadores y metadata.
- Backend: upload real, listado con filtros, detalle, descarga, guardar, valorar, reportar (DOCUMENT), visibilidad público/comunidad/privado, soft delete, integración feed.
- Frontend: `/app/apuntes` con datos reales, layout 3 columnas, modal de subida real, detalle real, todas las acciones conectadas.
- Comunidad: pestaña "Archivos" con apuntes reales + "Compartir apunte".
- Inicio: apuntes compartidos en comunidad aparecen como `DocumentAttachmentCard` en el feed.
- Pendiente: crear/aplicar la migración Prisma localmente (`npm run db:migrate -- --name apuntes_module`).
