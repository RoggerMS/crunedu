# Admin Security Checklist — CrunEdu

Alta: 2026-07-01. Módulo: administración integral.

## Acceso
- [x] Enlaces admin retirados de `MAIN_NAVIGATION`.
- [x] Entrada visible desde avatar solo para `user.role === "ADMIN"`.
- [x] Layout admin comprueba autenticación y rol desde `AuthProvider`.
- [x] API protege `/api/admin/*` con JWT + `AdminGuard`.

## Bypass de desarrollo
- [x] `.env.example` mantiene `DEV_RELAXED_AUTH=false` y `DEV_BYPASS_ADMIN_GATES=false`.
- [x] Arranque de API falla en `production` si un bypass está activo.
- [x] Se emite advertencia visible si un bypass se habilita en desarrollo.

## Reautenticación
- [x] `POST /api/admin/session` verifica contraseña.
- [x] Token opaco aleatorio; solo hash en PostgreSQL.
- [x] Expiración de 20 minutos.
- [x] `AdminStepUpGuard` exige `X-Admin-Session` en acciones delicadas.
- [ ] Cookie HttpOnly pendiente; se usa `sessionStorage` por arquitectura actual.

## Auditoría
- [x] `AdminAuditLog` central creado.
- [x] Acciones sensibles registran motivo y `safeBefore`/`safeAfter`.
- [x] No se registran contraseñas, tokens, cookies ni cabeceras Authorization.
- [x] `/api/admin/audit` es solo lectura.

## Datos sensibles
- [x] `/api/users/me` expone rol pero no `passwordHash`.
- [x] Servicios admin usan `select` explícito.
- [x] Panel no ofrece SQL, terminal, editor `.env`, Docker ni visor de secretos.

## Pendientes de cierre
- [ ] QA runtime local con ADMIN y USER.
- [ ] Verificar manualmente expiración real tras 20 minutos.
- [ ] Completar pantallas frontend CRUD avanzadas por módulo.
