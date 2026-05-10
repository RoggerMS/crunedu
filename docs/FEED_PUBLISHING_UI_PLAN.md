# Feed Publishing UI Plan

## Scope
- Mejorar `/app` para que el flujo de publicación se parezca al mock objetivo.
- Mantener publicación real conectada con `POST /api/posts`.

## Estado
- **In progress** (alta: 2026-05-10)

## Avance 2026-05-10 (iteración mock Fase 1/Fase 2)
- Feed `/app` actualizado con estructura más cercana al mock:
  - barra rápida de contexto (`Para ti`, `Siguiendo`, `Todas las comunidades`)
  - columna principal de publicaciones + columna lateral en desktop
  - bloque lateral con comunidades recomendadas y tendencias
- Composer mantiene publicación real conectada con backend existente (`POST /api/posts`) y acceso por modal.
- Se conserva flujo de comentarios y visualización actual del feed.

### Checklist de esta iteración
- [x] CTA principal de publicar visible arriba del feed.
- [x] Chips de navegación rápida del feed.
- [x] Layout en dos columnas (contenido + descubrimiento) para escritorio.
- [x] Mantener conectividad con posts reales.
- [ ] Igualar 1:1 el diseño final del mock (toolbar rica y adjuntos tipo documento).

## Entregables iniciales
1. Composer principal con CTA claro.
2. Selector visual de tipo de publicación.
3. Accesos a Apunte/Pregunta/Debate/Trámite.
4. Modal/tarjeta de publicación más completa.

## Pendiente siguiente iteración
- Integrar toolbar de formato rica (si backend lo permite).
- Adjuntos de documentos para apuntes con endpoint dedicado.
- Métricas y filtros de feed.
