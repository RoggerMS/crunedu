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
