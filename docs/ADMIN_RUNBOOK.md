# Admin Runbook — CrunEdu

Alta: 2026-07-01. Módulo: administración integral.

## Entrar al panel
1. Inicia sesión con una cuenta `ADMIN`.
2. Abre el menú del avatar superior.
3. Selecciona **Administración**.
4. Si la sesión administrativa no está activa, escribe nuevamente tu contraseña.

## Reautenticación
- La API crea una sesión opaca de 20 minutos con `POST /api/admin/session`.
- El token temporal se guarda en `sessionStorage` como riesgo residual documentado y se envía como `X-Admin-Session` en acciones delicadas.
- Cierra una sesión con `DELETE /api/admin/session/:id` o todas con `DELETE /api/admin/session/all`.

## Revisar reportes
1. Ve a `/app/admin/reportes`.
2. Filtra por estado, gravedad, módulo o fecha.
3. Abre el caso y aplica una acción reversible con motivo.
4. Verifica auditoría en `/app/admin/auditoria`.

## Restaurar contenido
1. Abre el módulo correspondiente: Feed, Comunidades, Preguntas, Apuntes, Momentos o Tienda.
2. Filtra por contenido oculto/archivado.
3. Usa **Restaurar** con motivo.
4. Confirma que el contenido reaparece en su vista pública si cumple las reglas de visibilidad.

## Suspender o reactivar usuarios
1. Ve a `/app/admin/usuarios`.
2. Busca al usuario por nombre, username o correo.
3. Abre el detalle.
4. Para suspensión o cambio de rol se requiere sesión administrativa reciente.
5. Indica motivo y duración cuando corresponda.

## Publicar avisos o promociones
1. Ve a `/app/admin/anuncios`.
2. Crea una promoción administrada por CrunEdu.
3. Usa enlaces internos o HTTPS; no se acepta HTML ni scripts.
4. Programa inicio/fin o activa/pausa desde el panel.

## Administrar destacados y ubicaciones
1. Ve a `/app/admin/ubicaciones`.
2. Selecciona área, entidad, posición y fechas.
3. El contenido original no se duplica; `ContentPlacement` solo referencia la entidad.

## Consultar auditoría
1. Ve a `/app/admin/auditoria`.
2. Filtra por administrador, módulo, acción, objetivo, fechas o `requestId`.
3. Los registros son solo lectura y no deben contener secretos.

## Revocar sesiones administrativas
1. Ve al módulo de sistema/sesión o usa `DELETE /api/admin/session/:id`.
2. Para revocar todas se requiere `X-Admin-Session` válido.

## PowerShell mínimo local
```powershell
cd C:\GITHUB\crunedu
docker compose up -d --build api web
docker compose exec api npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

$loginBody = @{ email = "admin@crunedu.local"; password = "CrunEdu123!" } | ConvertTo-Json
$login = Invoke-RestMethod "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
Invoke-RestMethod "http://localhost:4000/api/admin/dashboard" -Headers $headers
```
