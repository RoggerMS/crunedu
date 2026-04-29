# Feed Strategy v1 (Posts)

## Modos de feed

- `mode=recent`: ordenado por `createdAt desc`.
- `mode=relevant`: ranking híbrido con tres señales:
  - **Recencia**: penaliza publicaciones antiguas.
  - **Interacción temprana**: cuenta comentarios en las primeras 24h.
  - **Afinidad por comunidad**: usa actividad reciente del usuario (posts/comentarios) por comunidad en 30 días.

## Paginación cursor-based

`GET /api/posts` acepta:

- `cursor` (id del último post recibido)
- `limit` (1..30, default 10)
- `mode` (`recent` | `relevant`)

Respuesta:

- `items`: lista de publicaciones
- `nextCursor`: siguiente cursor o `null`
- `mode`: modo efectivo aplicado

## Anti-spam

Se agregó protección in-memory por instancia:

- Publicaciones: máximo 3 por minuto por usuario.
- Comentarios: máximo 8 por minuto por usuario.

También se agrega validación de contenido útil:

- Publicación: mínimo 20 caracteres y 3 palabras útiles.
- Comentario: mínimo 12 caracteres y 3 palabras útiles.

## Eventos de feed

Se registran eventos para medir calidad del ranking:

- `impression` al listar feed
- `click` al abrir detalle de post
- `create_post` al crear publicación

Formato actual de registro: `console.info` estructurado con prefijo `[feed_event]`.
