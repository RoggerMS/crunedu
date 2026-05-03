# Momentos Plan (MVP)

## Objetivo
Convertir **Momentos** en un feed simple y útil donde cualquier estudiante pueda compartir contexto universitario rápido, con opción de imagen y punto de entrada a contenido relacionado.

## Alcance implementado en esta tarea
- Botón colapsable para abrir/cerrar el formulario de publicación.
- Publicación directa de texto en Momentos.
- Adjuntar imagen en publicación (vista previa y render en la tarjeta publicada).
- Lista inicial vacía (se eliminaron momentos de ejemplo hardcodeados).
- Estado visual de impulso por tarjeta (toggle: `Impulsar momento` ↔ `Impulsado`).
- Impulso **solo visual** (sin persistencia ni conteo global en backend todavía).

## Pendiente siguiente fase
1. Persistencia backend (`GET /api/momentos`, `POST /api/momentos`) con autor y fecha real.
2. Reglas de impulso por usuario (una vez por día + desimpulsar), persistidas.
3. Enlace de origen cuando se comparte desde Inicio, Comunidades, Debates, Preguntas, Apuntes, Trámites o Tienda.
4. Vista detalle de momento con comentarios/discusión.
5. Upload real de imagen con almacenamiento y validaciones.

## Notas
- Esta fase prioriza UX base y validación rápida de flujo.
- Likes/dislikes y ranking global quedan para integración transversal posterior.
