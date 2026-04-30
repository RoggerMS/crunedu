# LOCAL_RUNBOOK

## Objetivo
Este runbook define los pasos exactos para arrancar y validar CrunEdu en entorno local de Windows 11 con Docker Desktop, sin usar comandos destructivos.

## Arranque local (PowerShell)
Ejecuta estos comandos en este orden:

```powershell
cd C:\GITHUB\crunedu
docker compose ps
docker compose up -d --build web
docker compose up -d --build api
Invoke-RestMethod http://localhost:4000/api/health
```

## Validación básica posterior al arranque
1. Confirmar estado de contenedores:

```powershell
docker compose ps
```

2. Validar salud del API:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

3. Validar endpoint de comunidades (datos reales):

```powershell
Invoke-RestMethod http://localhost:4000/api/communities
```

4. Abrir servicios en navegador:
   - Web: http://localhost:3000
   - API base: http://localhost:4000/api
   - MinIO Console: http://localhost:9001
   - Mailhog UI: http://localhost:8025

## Criterios de OK por servicio

### Web (`web`)
- `docker compose ps` muestra el contenedor `web` en estado `Up`.
- `http://localhost:3000` carga sin error 5xx.
- Las páginas principales renderizan sin pantalla en blanco.

### API (`api`)
- `docker compose ps` muestra el contenedor `api` en estado `Up`.
- `Invoke-RestMethod http://localhost:4000/api/health` responde correctamente.
- `Invoke-RestMethod http://localhost:4000/api/communities` devuelve comunidades reales.

### Base de datos (`db` / PostgreSQL)
- `docker compose ps` muestra el contenedor de base de datos en estado `Up`.
- La API responde consultas reales (por ejemplo `/api/communities`), indicando conexión activa a PostgreSQL.

### Redis (`redis`)
- `docker compose ps` muestra `redis` en estado `Up`.
- No aparecen errores de conexión a Redis en logs del API.

### MinIO (`minio`)
- `docker compose ps` muestra `minio` en estado `Up`.
- `http://localhost:9001` abre consola de MinIO.
- Credenciales configuradas permiten ingreso a la consola.

### Mailhog (`mailhog`)
- `docker compose ps` muestra `mailhog` en estado `Up`.
- `http://localhost:8025` abre interfaz web de Mailhog.
- El SMTP local queda disponible en puerto `1025` para pruebas.

## Fallas comunes y solución

### 1) Puertos ocupados
**Síntoma:** Docker falla al iniciar contenedores por conflicto de puertos (3000, 4000, 5432, 6379, 9000, 9001, 8025, 1025).

**Solución:**
1. Identifica procesos usando el puerto:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

2. Ubica el proceso por PID en el Administrador de tareas y ciérralo si corresponde.
3. Reintenta:

```powershell
docker compose up -d --build web
docker compose up -d --build api
```

### 2) Variables de entorno faltantes
**Síntoma:** errores al iniciar `web` o `api` relacionados con configuración, secretos o URLs no definidas.

**Solución:**
1. Verifica que existan archivos `.env` esperados por el proyecto.
2. Revisa variables críticas (por ejemplo conexión de base de datos, JWT, endpoints internos).
3. Reinicia servicios tras corregir variables:

```powershell
docker compose up -d --build web
docker compose up -d --build api
```

4. Confirma salud del API:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

### 3) Errores de build web/api
**Síntoma:** `docker compose up -d --build web` o `docker compose up -d --build api` termina con error de compilación.

**Solución:**
1. Revisa logs recientes:

```powershell
docker compose logs web --tail=80
docker compose logs api --tail=80
```

2. Corrige el error reportado (tipado, dependencias, imports, variables).
3. Reconstruye solo el servicio afectado:

```powershell
docker compose up -d --build web
# o

docker compose up -d --build api
```

## Notas de seguridad operativa
- Este runbook **no** incluye comandos destructivos.
- No usar eliminación de volúmenes.
- No resetear base de datos para incidentes comunes de arranque.

## Observabilidad operativa (logs, métricas, dashboard y alertas)

### 1) Logs estructurados de requests
Cada request HTTP en API emite un log JSON con:
- `requestId`
- `userId` (si existe JWT)
- `endpoint`
- `statusCode`
- `latencyMs`
- `timestamp`

Para ver logs recientes del API:

```powershell
docker compose logs api --tail=120
```

Para correlacionar incidentes:
1. Busca un `requestId` reportado por frontend o por cliente.
2. Filtra en logs por ese `requestId`.
3. Revisa `statusCode`, `latencyMs` y `endpoint` para identificar el fallo.

### 2) Métricas mínimas
Endpoint de métricas:

```powershell
Invoke-RestMethod http://localhost:4000/api/observability/metrics
```

Campos clave por endpoint:
- `p95LatencyMs`
- `errorRate`
- `throughput`

Interpretación rápida:
- `p95LatencyMs` alto = degradación de performance.
- `errorRate` alto = errores funcionales o dependencia caída.
- `throughput` = volumen de tráfico que recibe cada endpoint.

### 3) Eventos de producto instrumentados
Se registran eventos JSON (`message: product_event`) para:
- `login_success`
- `post_created`
- `comment_created`
- `follow`
- `unfollow`

Diagnóstico:
- Si hay tráfico técnico pero no eventos de producto, revisar auth/UI y flujo de usuario.
- Si hay muchos `follow/unfollow` con errores, revisar permisos y estado del endpoint users.

### 4) Dashboard operativo y alertas
Dashboard operativo:

```powershell
Invoke-RestMethod http://localhost:4000/api/observability/dashboard
```

Incluye:
- Resumen global (`throughputTotal`, `errorRateGlobal`, `activeAlerts`).
- Métricas por endpoint (p95/errorRate/throughput).
- Métricas de producto (logins, posts, comments, follows).
- Alertas activas.

Umbrales base:
- Alerta de latencia: `p95LatencyMs > 800` con throughput mínimo.
- Alerta de error endpoint: `errorRate > 5%` con throughput mínimo.
- Alerta global crítica: `errorRateGlobal > 8%`.

### 5) Protocolo corto de incidente
1. Confirmar salud base:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

2. Verificar alertas activas:

```powershell
Invoke-RestMethod http://localhost:4000/api/observability/dashboard
```

3. Identificar endpoint degradado (p95/errorRate).
4. Correlacionar con logs estructurados por `requestId`.
5. Revisar si el incidente afecta eventos de producto (login/post/comment/follow).
6. Mitigar primero el endpoint con mayor impacto (error rate y throughput).


## Regresión local rápida (script único)

Ejecuta el smoke de regresión MVP en un solo comando:

```powershell
cd C:\GITHUB\crunedu
npm run regression:quick
```

Salida esperada:
- múltiples líneas con formato `✅ / ⚠️ / ❌` por check
- resumen final en consola con patrón: `Resumen: PASS=<n> FAIL=<n> SKIP=<n>`
- línea final: `Integration smoke tests passed.` cuando todo termina correctamente

Si aparece `FAIL>0`, revisar el primer `❌` y correlacionar con logs del API:

```powershell
docker compose logs api --tail=120
```

## Modo relajado de desarrollo (solo `NODE_ENV=development`)

### Flags disponibles en `.env`
- `DEV_RELAXED_AUTH=false`
- `DEV_BYPASS_ADMIN_GATES=false`

Estas flags **solo tienen efecto** cuando `NODE_ENV=development`. En `production` se ignoran automáticamente.

### Cómo activar/desactivar
1. Edita tu archivo `.env` local.
2. Activa solo la flag que necesites:

```powershell
# Ejemplo en .env
NODE_ENV=development
DEV_RELAXED_AUTH=true
DEV_BYPASS_ADMIN_GATES=true
```

3. Reinicia servicios para aplicar cambios:

```powershell
docker compose up -d --build api
```

4. Para desactivar modo relajado, vuelve ambas flags a `false` y reinicia API.

### Qué relaja cada flag
- `DEV_RELAXED_AUTH=true`: permite pasar guards JWT en desarrollo incluso sin token válido (usa usuario técnico local de desarrollo).
- `DEV_BYPASS_ADMIN_GATES=true`: permite pasar validaciones de rol admin en endpoints administrativos durante desarrollo.

### Riesgos
- Puede ocultar errores reales de autenticación/autorización si se deja activo durante pruebas finales.
- No debe usarse para pruebas de seguridad o pruebas de regresión pre-release.
- Nunca debe activarse fuera de entorno local de desarrollo.

### Checklist antes de pasar a producción
1. Confirmar `NODE_ENV=production`.
2. Confirmar `DEV_RELAXED_AUTH=false`.
3. Confirmar `DEV_BYPASS_ADMIN_GATES=false`.
4. Rebuild/redeploy del API con variables finales.
5. Validar login real con JWT y endpoints admin con usuario no admin (debe fallar con 401/403 según corresponda).
