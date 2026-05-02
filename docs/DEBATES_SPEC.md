# DEBATES_SPEC

## Objetivo

Crear un módulo de debates académicos y extracurriculares donde estudiantes puedan conversar por curso, semana y tema común.

## Alcance MVP de Debates

1. Debates por categoría:
   - Generales
   - Especialidad
   - Extras (fuera de cursos formales)
2. Publicación de postura (`stance`) por tema semanal.
3. Respuestas a cada debate.
4. Filtro por curso (`courseKey`) y semana ISO (`YYYY-Www`).

## Diferencia frente a otros módulos

- **Feed**: publicaciones abiertas de comunidad.
- **Preguntas**: dudas puntuales con respuestas.
- **Debates**: discusión argumentada sobre un tema/curso semanal.
- **Momentos**: contenido destacado o tendencia del campus.

## Contrato funcional mínimo

- `GET /api/debates?courseKey=...&week=YYYY-Www`
- `POST /api/debates` (JWT)
- `POST /api/debates/:id/responses` (JWT)

## Reglas de UX

1. El usuario elige categoría y curso antes de crear debate.
2. Si no hay debates en el curso, mostrar estado vacío con CTA para crear el primero.
3. Los formularios de crear debate y responder deben ser colapsables.
4. Copy visible en español y mensajes de error claros.

## Backlog siguiente (post-MVP)

- Reacciones en debates.
- Moderación específica por curso.
- Vinculación con contenidos de Momentos.
- Audio en debates (no implementar ahora).
