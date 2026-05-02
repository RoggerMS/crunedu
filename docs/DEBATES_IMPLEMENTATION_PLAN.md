# DEBATES_IMPLEMENTATION_PLAN

## Objetivo

Convertir Debates en un módulo usable por estudiantes: crear debate por curso, responder y revisar actividad semanal.

## Estado actual

- API básica disponible con:
  - `GET /api/debates`
  - `POST /api/debates`
  - `POST /api/debates/:id/responses`
- Frontend con categorías `Generales`, `Especialidad`, `Extras`.

## Implementado en esta iteración

1. Selección de categoría y curso con resaltado del curso activo.
2. Carga real de debates por `courseKey` + semana ISO actual.
3. Formulario colapsable para crear debates.
4. Flujo de respuestas por debate con actualización de lista.
5. Mensajes de estado (`loading/error/success`) y estado vacío.

## Pendiente

1. Persistencia en base de datos (actualmente memoria en API).
2. Moderación específica del módulo Debates.
3. Métricas de interacción por curso y semana.
4. Integración de “debates destacados” en Momentos.

## Estado

- Estado: **En progreso**
- Responsable: Web/API
