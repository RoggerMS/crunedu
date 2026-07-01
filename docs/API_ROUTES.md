# API Routes - CrunEdu

Base URL local: `http://localhost:4000/api`

**Nota de autenticación:** algunas rutas requieren `Authorization: Bearer <token>`.

## Rutas básicas para probar después de levantar Docker

```powershell
Invoke-RestMethod "http://localhost:4000/api/health"
Invoke-RestMethod "http://localhost:4000/api/communities"
Invoke-RestMethod "http://localhost:4000/api/marketplace/categories"
Invoke-RestMethod "http://localhost:4000/api/posts"
Invoke-RestMethod "http://localhost:4000/api/debates?courseKey=didactica-general"
```

## Cómo obtener y reutilizar token JWT

```powershell
$loginBody = @{
  email = "admin@crunedu.local"
  password = "CrunEdu123!"
} | ConvertTo-Json

$login = Invoke-RestMethod "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }
```

---

## Health

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/health` | No | Ninguno | N/A | `{ ok: true, service, timestamp }` | `Invoke-RestMethod "http://localhost:4000/api/health"` |

## Auth

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | No | Ninguno | `email` (email), `password` (string, min 8), `firstName` (string, min 2), `lastName` (string, min 2) | Usuario creado + token/sesión según servicio | Ver ejemplo abajo |
| POST | `/auth/login` | No | Ninguno | `email` (email), `password` (string, min 8) | `accessToken` JWT + datos de usuario | Ver ejemplo abajo |

```powershell
$registerBody = @{
  email = "nuevo@crunedu.local"
  password = "CrunEdu123!"
  firstName = "Ana"
  lastName = "Quispe"
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:4000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $registerBody
```

```powershell
$body = @{
  email = "admin@crunedu.local"
  password = "CrunEdu123!"
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:4000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

## Users y Follows

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/users/me` | JWT | Ninguno | N/A | Perfil del usuario autenticado | `Invoke-RestMethod "http://localhost:4000/api/users/me" -Headers $headers` |
| PATCH | `/users/me` | JWT | Ninguno | Todos opcionales: `firstName`, `lastName`, `bio`, `faculty`, `career`, `cycle` (strings con límites de longitud) | Perfil actualizado | Ver ejemplo abajo |
| GET | `/users/:id` | No | Ninguno | N/A | Perfil público del usuario | `Invoke-RestMethod "http://localhost:4000/api/users/1"` |
| GET | `/users/:id/followers` | No | Ninguno | N/A | Lista de seguidores | `Invoke-RestMethod "http://localhost:4000/api/users/1/followers"` |
| GET | `/users/:id/following` | No | Ninguno | N/A | Lista de seguidos | `Invoke-RestMethod "http://localhost:4000/api/users/1/following"` |
| GET | `/users/:id/friends` | No | Ninguno | N/A | Lista de amistades mutuas | `Invoke-RestMethod "http://localhost:4000/api/users/1/friends"` |
| POST | `/follows/:userId` | JWT | Ninguno | N/A | Estado de follow exitoso | `Invoke-RestMethod "http://localhost:4000/api/follows/2" -Method POST -Headers $headers` |
| DELETE | `/follows/:userId` | JWT | Ninguno | N/A | Estado de unfollow exitoso | `Invoke-RestMethod "http://localhost:4000/api/follows/2" -Method DELETE -Headers $headers` |

```powershell
$updateMe = @{
  firstName = "Carlos"
  bio = "Estudiante de La Cantuta"
} | ConvertTo-Json

Invoke-RestMethod "http://localhost:4000/api/users/me" `
  -Method PATCH `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $updateMe
```

## Communities

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/communities` | No | Ninguno | N/A | Lista de comunidades | `Invoke-RestMethod "http://localhost:4000/api/communities"` |
| GET | `/communities/recommended` | JWT | Ninguno | N/A | Comunidades recomendadas al usuario | `Invoke-RestMethod "http://localhost:4000/api/communities/recommended" -Headers $headers` |
| POST | `/communities` | JWT | Ninguno | `name` (3-80), opcionales `description`, `rules`, `avatarUrl`, `coverUrl` | Comunidad creada | Ver ejemplo abajo |
| GET | `/communities/:id` | No | Ninguno | N/A | Detalle de comunidad | `Invoke-RestMethod "http://localhost:4000/api/communities/1"` |
| GET | `/communities/:id/posts` | No | `cursor?` int positivo, `limit?` int positivo | N/A | Posts de comunidad con paginación | `Invoke-RestMethod "http://localhost:4000/api/communities/1/posts?limit=10"` |
| POST | `/communities/:id/join` | JWT | Ninguno | N/A | Unión a comunidad | `Invoke-RestMethod "http://localhost:4000/api/communities/1/join" -Method POST -Headers $headers` |
| POST | `/communities/:id/leave` | JWT | Ninguno | N/A | Salida de comunidad | `Invoke-RestMethod "http://localhost:4000/api/communities/1/leave" -Method POST -Headers $headers` |
| POST | `/communities/:id/posts/:postId/hide` | JWT | Ninguno | `reason?` string | Marca/oculta publicación para el usuario | Ver ejemplo abajo |

## Posts

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/posts` | No (usa guard opcional) | `cursor?` int>=1, `limit?` int>=1<=30, `mode?` `recent|relevant` | N/A | Feed de publicaciones | `Invoke-RestMethod "http://localhost:4000/api/posts"` |
| GET | `/posts/discovery` | No (guard opcional) | `page?` int>=1, `perSection?` int>=1<=10 | N/A | Feed discovery | `Invoke-RestMethod "http://localhost:4000/api/posts/discovery?page=1"` |
| GET | `/posts/:id` | No (guard opcional) | Ninguno | N/A | Detalle de post | `Invoke-RestMethod "http://localhost:4000/api/posts/1"` |
| POST | `/posts` | JWT | Ninguno | `content` (5-5000), `communityId` int>=1, `title?` (3-120), `images?[]` | Post creado | Ver ejemplo abajo |
| POST | `/posts/images` | JWT | Ninguno | `multipart/form-data` con campo `image` | URL/metadata de imagen subida | `Invoke-RestMethod "http://localhost:4000/api/posts/images" -Method POST -Headers $headers -Form @{ image = Get-Item ".\foto.jpg" }` |
| GET | `/posts/images/:filename` | No | Ninguno | N/A | Archivo de imagen | `Invoke-RestMethod "http://localhost:4000/api/posts/images/archivo.jpg" -OutFile .\descarga.jpg` |
| GET | `/posts/:id/comments` | No | Ninguno | N/A | Comentarios del post | `Invoke-RestMethod "http://localhost:4000/api/posts/1/comments"` |
| POST | `/posts/:id/comments` | JWT | Ninguno | `content` string, no vacío, max 1000 | Comentario creado | Ver ejemplo abajo |
| PATCH | `/posts/:id` | JWT | Ninguno | Opcionales: `title?`, `content?`, `communityId?` | Post actualizado | Ver ejemplo abajo |
| DELETE | `/posts/:id` | JWT | Ninguno | N/A | Post eliminado | `Invoke-RestMethod "http://localhost:4000/api/posts/1" -Method DELETE -Headers $headers` |

## Questions

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/questions` | No | `cursor?` int>=1, `limit?` int>=1 | N/A | Lista de preguntas | `Invoke-RestMethod "http://localhost:4000/api/questions"` |
| POST | `/questions` | JWT | Ninguno | `title` (5-160), `content` (10-5000), `communityId?` int>=1 | Pregunta creada | Ver ejemplo abajo |
| POST | `/questions/:id/answers` | JWT | Ninguno | `content` (5-3000) | Respuesta creada | Ver ejemplo abajo |

## Debates

> Importante: `GET /api/debates` **requiere** `courseKey`. Si no se envía, la validación puede responder `400 Bad Request`.

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/debates` | No | `courseKey` **obligatorio** string, `week?` formato `YYYY-W##` | N/A | Lista de debates por curso/semana | `Invoke-RestMethod "http://localhost:4000/api/debates?courseKey=didactica-general"` |
| POST | `/debates` | JWT | Ninguno | `courseKey`, `weeklyTopic` (5-160), `stance` (10-1500), `audioNoteUrl?` | Debate creado | Ver ejemplo abajo |
| POST | `/debates/:id/responses` | JWT | Ninguno | `content` (2-1000) | Respuesta al debate | Ver ejemplo abajo |

## Apuntes / Documents

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/apuntes` | No (guard opcional) | `course?` max 80, `cycle?` max 40 | N/A | Lista de apuntes/documentos | `Invoke-RestMethod "http://localhost:4000/api/apuntes?course=matematica"` |
| POST | `/apuntes` | JWT | Ninguno | `title` (5-120), `description` (10-1200), `course` (2-80), `fileUrl` (5-500), `cycle?`, `communityId?` int>=1 | Documento creado | Ver ejemplo abajo |

## Marketplace

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/marketplace/categories` | No | Ninguno | N/A | Categorías | `Invoke-RestMethod "http://localhost:4000/api/marketplace/categories"` |
| GET | `/marketplace/products` | No | `categoryId?`, `faculty?`, `career?`, `cursor?`, `limit?` (numéricos positivos donde aplica) | N/A | Catálogo paginado | `Invoke-RestMethod "http://localhost:4000/api/marketplace/products?categoryId=1&limit=10"` |
| GET | `/marketplace/products/:id` | No | Ninguno | N/A | Detalle producto | `Invoke-RestMethod "http://localhost:4000/api/marketplace/products/1"` |
| POST | `/marketplace/products/:id/inquiries` | JWT | Ninguno | `contactName`, `contactPhone` (`^9\d{8}$`), `message`, `preferredContactMethod` (`whatsapp|email`) | Consulta creada | Ver ejemplo abajo |
| POST | `/marketplace/admin/products` | JWT + Admin | Ninguno | `CreateProductDto` o `UpdateProductDto` (incluye `id` para update) | Alta/actualización de producto | Ver ejemplo abajo |
| GET | `/marketplace/admin/inquiries` | JWT + Admin | `cursor?`, `limit?` | N/A | Inquiries administrativas | `Invoke-RestMethod "http://localhost:4000/api/marketplace/admin/inquiries" -Headers $headers` |
| GET | `/marketplace/admin/products` | JWT + Admin | Ninguno | N/A | Productos admin | `Invoke-RestMethod "http://localhost:4000/api/marketplace/admin/products" -Headers $headers` |
| POST | `/marketplace/admin/inquiries/:id/status` | JWT + Admin | Ninguno | `{ "status": "string" }` | Cambio de estado de consulta | Ver ejemplo abajo |
| GET | `/marketplace/admin/metrics` | JWT + Admin | Ninguno | N/A | Métricas de conversión | `Invoke-RestMethod "http://localhost:4000/api/marketplace/admin/metrics" -Headers $headers` |

## Observability

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/observability/metrics` | No | Ninguno | N/A | Snapshot de métricas | `Invoke-RestMethod "http://localhost:4000/api/observability/metrics"` |
| GET | `/observability/dashboard` | No | Ninguno | N/A | Dashboard resumido | `Invoke-RestMethod "http://localhost:4000/api/observability/dashboard"` |

## Reports (moderación)

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| POST | `/reports` | JWT | Ninguno | `targetType` (`POST|COMMENT`), `targetId` int>=1, `reason` max 500 | Reporte creado | Ver ejemplo abajo |
| GET | `/reports` | JWT + Admin | `communityId?`, `severity?`, `status?`, `dateFrom?`, `dateTo?` | N/A | Listado de reportes para moderación | `Invoke-RestMethod "http://localhost:4000/api/reports?status=open" -Headers $headers` |
| PATCH | `/reports/:id/moderate` | JWT + Admin | Ninguno | `status`, `decision`, `reason`, `sanctionHours?` | Reporte moderado | Ver ejemplo abajo |
| PATCH | `/reports/bulk/moderate` | JWT + Admin | Ninguno | `{ reportIds: number[], moderation: ModerateReportDto }` | Moderación masiva | Ver ejemplo abajo |
| GET | `/reports/:id/audit` | JWT + Admin | Ninguno | N/A | Auditoría del reporte | `Invoke-RestMethod "http://localhost:4000/api/reports/1/audit" -Headers $headers` |
| GET | `/reports/reputation/:userId` | JWT + Admin | Ninguno | N/A | Reputación de usuario | `Invoke-RestMethod "http://localhost:4000/api/reports/reputation/1" -Headers $headers` |

## Search

| Método | Ruta | Auth requerida | Query params | Body | Respuesta esperada | Ejemplo PowerShell |
|---|---|---|---|---|---|---|
| GET | `/search` | No | `q?` max 120, `type?` (`posts|questions|communities|products`), `page?` int>=1, `limit?` int>=1<=20 | N/A | Resultados unificados de búsqueda | `Invoke-RestMethod "http://localhost:4000/api/search?q=apuntes&type=posts"` |

---

## Ejemplos adicionales de body (POST/PATCH)

```powershell
# POST /posts
$postBody = @{
  title = "Necesito apuntes de cálculo"
  content = "¿Alguien tiene material de la semana 3?"
  communityId = 2
} | ConvertTo-Json
Invoke-RestMethod "http://localhost:4000/api/posts" -Method POST -Headers $headers -ContentType "application/json" -Body $postBody

# POST /questions
$questionBody = @{
  title = "Duda sobre matrícula"
  content = "¿Qué documentos piden este ciclo?"
  communityId = 3
} | ConvertTo-Json
Invoke-RestMethod "http://localhost:4000/api/questions" -Method POST -Headers $headers -ContentType "application/json" -Body $questionBody

# POST /debates
$debateBody = @{
  courseKey = "didactica-general"
  weeklyTopic = "Evaluación formativa"
  stance = "Creo que la retroalimentación debe ser semanal."
} | ConvertTo-Json
Invoke-RestMethod "http://localhost:4000/api/debates" -Method POST -Headers $headers -ContentType "application/json" -Body $debateBody
```

## Errores comunes

- **400 Bad Request**: faltan parámetros obligatorios o formato inválido.
  - Ejemplo: `GET /api/debates` sin `courseKey`.
- **401 Unauthorized**: no se envió token o el token es inválido/expirado en rutas protegidas.
  - Solución: enviar header `Authorization: Bearer <token>`.
- **404 Not Found**: recurso no existe.
  - Ejemplo: `GET /api/posts/999999` si ese ID no existe.
- **200 con lista vacía `[]`**: no hay registros en una tabla limpia o filtro sin resultados.


## Admin namespace

Todas las rutas `/admin/*` requieren `Authorization: Bearer <token>` y rol backend `ADMIN`, salvo `/promotions/public` que es público para ubicaciones visibles.

| Método | Ruta | Auth requerida | Body / Query | Respuesta esperada |
|---|---|---|---|---|
| GET | `/admin/dashboard` | JWT ADMIN | N/A | Métricas reales, reportes prioritarios y actividad reciente. |
| POST | `/admin/session` | JWT ADMIN | `{ password }` | Token opaco temporal y `expiresAt` para acciones step-up. |
| GET | `/admin/session` | JWT ADMIN | N/A | Sesiones administrativas activas propias. |
| DELETE | `/admin/session/:id` | JWT ADMIN | N/A | Revoca sesión administrativa propia. |
| DELETE | `/admin/session/all` | JWT ADMIN + `X-Admin-Session` | N/A | Revoca todas las sesiones propias. |
| GET | `/admin/users` | JWT ADMIN | `search`, `role`, `status`, `verified`, `cursor`, `limit` | Lista paginada sin `passwordHash`. |
| GET | `/admin/users/:id` | JWT ADMIN | N/A | Detalle administrativo seguro. |
| PATCH | `/admin/users/:id/role` | JWT ADMIN + step-up | `{ role, reason }` | Cambio de rol auditado. |
| POST | `/admin/users/:id/sanction` | JWT ADMIN + step-up | `{ type, reason, expiresAt? }` | Sanción reversible auditada. |
| GET | `/admin/reports` | JWT ADMIN/MODERATOR según permiso | Filtros | Casos unificados de reportes. |
| POST | `/admin/reports/:id/moderate` | JWT ADMIN/MODERATOR según permiso | Moderación | Decisión auditada. |
| GET | `/admin/feed/posts` | JWT ADMIN | Filtros | Publicaciones administrables. |
| POST | `/admin/feed/posts/:id/status` | JWT ADMIN | `{ status, reason }` | Oculta/restaura publicación e invalida caché. |
| GET | `/admin/communities` | JWT ADMIN | Filtros | Comunidades administrables. |
| POST | `/admin/communities/:id/archive` | JWT ADMIN + step-up | `{ reason }` | Archiva comunidad sin borrar contenido. |
| GET | `/admin/questions` | JWT ADMIN | Filtros | Preguntas administrables. |
| GET | `/admin/documents` | JWT ADMIN | Filtros | Apuntes/documentos administrables. |
| GET | `/admin/university` | JWT ADMIN | Filtros | Contenido universitario administrable. |
| GET | `/admin/moments` | JWT ADMIN | Filtros | Momentos administrables. |
| GET | `/admin/conversations` | JWT ADMIN | Filtros | Salas Conversar administrables. |
| POST | `/admin/conversations/:id/end` | JWT ADMIN + step-up | `{ reason }` | Termina sala y audita. |
| GET | `/admin/store/products` | JWT ADMIN | Filtros | Productos administrables. |
| GET | `/admin/store/categories` | JWT ADMIN | N/A | Categorías de tienda. |
| GET | `/admin/store/inquiries` | JWT ADMIN | Filtros | Consultas administrables. |
| GET/POST | `/admin/promotions` | JWT ADMIN | DTO validado | Lista/crea promociones internas. |
| GET/POST | `/admin/placements` | JWT ADMIN | DTO validado | Lista/crea ubicaciones de contenido. |
| GET | `/admin/audit` | JWT ADMIN | Filtros | Auditoría central solo lectura. |
| GET | `/admin/system/health` | JWT ADMIN | N/A | Salud sin secretos. |
