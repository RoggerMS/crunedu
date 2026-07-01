# Admin Implementation Status — CrunEdu

Alta: 2026-06-30. módulo: Panel de administración integral (seguridad + backend + DB + auditoría + frontend admin).

## 1. Diagnóstico inicial

### Seguridad
- `DevSecurityService` centraliza `assertAdmin(role, msg)` pero se repite `this.devSecurity.assertAdmin(...)` en cada controlador (reports, marketplace, university). No hay guard ni decorador declarativo.
- `JwtAuthGuard` permite **bypass de auth** cuando `DEV_RELAXED_AUTH=true` (asigna `role: "ADMIN"` sin token). `assertAdmin` permite bypass con `DEV_BYPASS_ADMIN_GATES=true`. Ambos están gated por `NODE_ENV === "development"`, **pero no hay validación de arranque** que impida iniciar la API en production con los flags activos.
- No existe sesión administrativa ni reautenticación (step-up).
- No existe `AdminAuditLog` central. Existen `ModerationLog` (solo moderación de reportes) y `UniversityAuditLog` (solo Universidad), sin trazabilidad general de acciones admin.
- No existe `AdminPermissionGuard` ni permisos granulares.

### Frontend admin
- `MAIN_NAVIGATION` expone **públicamente** `Admin`, `Admin tienda`, `Admin reportes` a todos los usuarios.
- Las páginas admin decodifican el JWT manualmente con `parseRole(token)` (reportes, tienda) en lugar de usar el rol del `AuthProvider`.
- No hay layout admin que proteja rutas ni pida reautenticación.
- Páginas admin existentes: `/app/admin` (índice estático), `/app/admin/reportes`, `/app/admin/tienda`, `/app/admin/tramites/nuevo`. No hay dashboard real, usuarios, auditoría, feed, comunidades, conversar, preguntas, apuntes, universidad, momentos, anuncios, ubicaciones ni sistema.

### Backend admin
- No existe `apps/api/src/modules/admin/`.
- Endpoints admin dispersos: `/api/reports*`, `/api/marketplace/admin/*`, `/api/university*` (admin). No hay namespace `/api/admin/*`.
- No hay dashboard agregado, ni administración de usuarios, ni de feed, ni de comunidades, ni de conversar, ni de preguntas, ni de apuntes, ni de momentos, ni de promociones, ni de ubicaciones, ni de auditoría, ni de salud.

### Base de datos
- Modelos existentes reutilizables: `Report` (polimórfico: post/comment/question/answer/document/product/moment), `ModerationLog`, `UserSanction`, `Notification`.
- **Faltan**: `AdminSession`, `AdminAuditLog`, `Promotion`, `ContentPlacement`.

## 2. Riesgos detectados
- Bypass de desarrollo podría activarse en production por configuración errónea sin bloqueo de arranque.
- Enlaces admin visibles a usuarios normales (falsa seguridad por ocultación inexistente).
- Decodificación manual del JWT en frontend (rol client-side sin revalidación real).
- Ausencia de auditoría central impide trazabilidad de acciones sensibles (cambios de rol, sanciones, destacados).
- Moderación no reversible de forma uniforme (no hay `restored`/`archived` consistente).
- Sin step-up, un token JWT robado permite acciones destructivas.

## 3. Arquitectura elegida
- **Namespace único**: `/api/admin/*` con `AdminModule` central que coordina servicios existentes (no duplica lógica de dominio).
- **Autorización declarativa**: `@AdminOnly()`, `@AdminPermission("...")`, `@RequireAdminStepUp()` + guards `AdminGuard`, `AdminStepUpGuard`, `AdminPermissionGuard`.
- **Sesión admin**: token opaco, hash almacenado, 20 min, revocable, enviado vía header `X-Admin-Session` (cookie HttpOnly no viable sin romper auth CORS existente; documentado como riesgo residual).
- **Auditoría central**: `AdminAuditLog` con `safeBefore`/`safeAfter` (sin secretos).
- **Moderación reversible**: soft delete / hidden / archived / restored; sin hard delete desde el panel.
- **Invalidación de caché**: `HotReadCacheService.invalidate(...)` tras cada acción que afecte el feed/páginas públicas.
- **Frontend**: shell admin propio con layout protegido, sidebar, componentes reutilizables; rol desde `AuthProvider` (no decodificar JWT).

## 4. Fases
- **Fase 1 — Seguridad**: ocultar enlaces, rol en AuthUser, layout admin, guard central, bloqueo de bypass en prod, sesión admin, auditoría central. (en progreso)
- **Fase 2 — Núcleo**: dashboard real, reportes unificados, usuarios admin, tablas reutilizables, acciones reversibles.
- **Fase 3 — Contenido**: feed, comunidades, preguntas, apuntes, momentos.
- **Fase 4 — Operativos**: universidad, conversar, tienda.
- **Fase 5 — Distribución**: destacados/ubicaciones, tendencias, módulos laterales, anuncios/promociones.
- **Fase 6 — Cierre**: pruebas `test:admin`, responsive, docs, verificación Docker.

## 5. Estado actual
- In progress — Fase 1-2 en implementación.

## 6. Pendientes (resumen)
- Aplicar migración `20260701020000_admin_module` localmente con Docker.
- Verificación runtime HTTP con ADMIN/USER (PowerShell).
- Activar Egress/recordings en Conversar (fuera de alcance admin).
- Pruebas `test:admin` automáticas (casos mínimos de seguridad).
