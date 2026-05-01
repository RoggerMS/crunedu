# Debates — Especificación MVP

## Objetivo
Crear un espacio de debate académico por curso y por tema semanal para fomentar participación argumentada entre estudiantes.

## Diferencia contra Feed / Preguntas
- **Feed (Posts):** publicación libre de novedades/opiniones generales.
- **Preguntas:** resolver dudas puntuales con respuestas útiles.
- **Debates:** discusión estructurada por **curso + tema semanal**, con posturas/opiniones y réplicas.

## Reglas de participación
1. Respetar a los demás; no insultos ni ataques personales.
2. Argumentar la postura con claridad y enfoque académico.
3. Evitar spam y contenido fuera del tema semanal.
4. No compartir datos personales sensibles.
5. Moderación puede ocultar contenido que incumpla normas.

## Modelo mínimo Debate
- `courseKey`: clave del curso.
- `weeklyTopic`: tema semanal vigente.
- `stance`: postura/opinión inicial del autor.
- `responses`: respuestas al debate.

## Audio (fuera de alcance)
El MVP solo incluye texto. Se deja preparado a nivel de arquitectura un campo opcional `audioNoteUrl` para futura extensión sin activar carga/reproducción de audio en esta fase.
