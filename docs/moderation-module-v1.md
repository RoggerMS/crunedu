# Módulo de moderación v1 (reportes, reputación, sanciones y auditoría)

## Estados de reporte
Se habilitó flujo operativo con estados visibles en API:
- `open`
- `reviewing`
- `resolved`

Internamente se mapean a Prisma `OPEN`, `UNDER_REVIEW`, `RESOLVED`.

## Reputación simple por usuario
Endpoint administrativo:
- `GET /api/reports/reputation/:userId`

Fórmula actual:
- `+10` por respuesta útil (`isUseful=true`)
- `+5` adicional por respuesta útil en pregunta resuelta
- `-15` por contenido reportado y confirmado (reporte `RESOLVED` contra post/comentario del usuario)

## Sanciones graduales
Decisiones en moderación (`PATCH /api/reports/:id/moderate`):
- `warning`
- `temp_post_limit`
- `suspension`
- `dismiss`

Persistencia:
- tabla `user_sanctions` (activa por defecto, con expiración opcional)

## Panel operativo de moderación
Endpoint:
- `GET /api/reports?communityId=1&severity=high`

Soporta:
- cola priorizada por severidad + antigüedad
- filtro por comunidad
- filtro por gravedad (`high|medium|low`)

## Auditoría de decisiones
Cada moderación registra trazabilidad en `moderation_logs` con:
- acción aplicada
- moderador
- reporte
- motivo
- estado final
- usuario objetivo

## Notas MVP
- El flujo opera sobre reportes de `POST` y `COMMENT` en esta versión.
- No se incluyeron notificaciones ni automatización de rehabilitación de sanciones (pendiente siguiente iteración).
