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
