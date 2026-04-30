# Checklist de regresión MVP (manual + automatizado)

> Fuente de verdad para regresión del MVP.  
> Automatización principal: `apps/api/src/tests/integration.smoke.ts`.

## 1) Auth

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| `POST /api/auth/register` crea usuario nuevo. | ✅ | Automatizada | Smoke crea usuarios de prueba. |
| `POST /api/auth/login` devuelve `accessToken` válido. | ✅ | Automatizada | Smoke valida login de 2 usuarios. |
| Login con contraseña inválida responde `401`. | ✅ | Automatizada | Smoke valida error esperado. |
| Rate limit registro (5/min por IP) responde `429` con mensaje claro. | ✅ | Automatizada | Smoke fuerza límite por IP. |
| Rate limit login (8/min por IP) responde `429` con mensaje claro. | ⚠️ | Manual | No se fuerza en smoke para evitar inestabilidad por ventana temporal compartida con otras pruebas de auth. |

## 2) Communities

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| `GET /api/communities` responde `200`. | ⚠️ | Manual | Se mantiene como prueba manual/local UI, no bloquea smoke de API actual. |
| Devuelve comunidades reales: Cachimbos, Apuntes, Trámites, General. | ⚠️ | Manual | Se valida mejor en entorno local con datos semilla. |
| Frontend `/app/comunidades` muestra datos reales sin mocks. | ⚠️ | Manual | Requiere validación visual web end-to-end. |

## 3) Feed (posts)

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| `GET /api/posts` lista publicaciones. | ✅ | Automatizada | Smoke valida `200`. |
| `POST /api/posts` sin token responde `401`. | ✅ | Automatizada | Smoke valida auth esperada. |
| `POST /api/posts` con token crea publicación ligada a usuario/comunidad. | ✅ | Automatizada | Smoke crea post autenticado. |
| `GET /api/posts/:id/comments` lista comentarios. | ✅ | Automatizada | Smoke valida `200`. |
| `POST /api/posts/:id/comments` con token crea comentario. | ✅ | Automatizada | Smoke crea comentario autenticado. |
| Límite comentarios 8/min por usuario (20/IP). | ✅ | Automatizada | Smoke fuerza `429` en comentario #9 de usuario. |
| Límite posts 3/min por usuario (10/IP). | ⚠️ | Manual | No cubierto aún en smoke dedicado para mantener duración estable y evitar solape con otros límites globales. |

## 4) Questions

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| `GET /api/questions` lista preguntas. | ⚠️ | Manual | Fuera del foco de esta expansión de smoke. |
| `POST /api/questions` con token crea pregunta. | ⚠️ | Manual | Pendiente de incluir en suite de regresión ampliada de preguntas. |
| `POST /api/questions/:id/answers` con token crea respuesta. | ⚠️ | Manual | Pendiente; requiere flujo completo pregunta->respuesta en una misma suite estable. |

## 5) Follows / relación y anti-spam

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| `POST /api/follows/:userId` crea follow con token. | ✅ | Automatizada | Smoke ejecuta follow entre usuarios de prueba. |
| Estado de relación (follow/friend) visible en perfil/listas. | ✅ | Automatizada | Smoke valida relación `isFollowing` y endpoint friends `200`. |
| Límite follow 12/min usuario (20/IP). | ⚠️ | Manual | Pendiente incluir prueba dedicada sin contaminar otros límites de usuario/IP. |
| Duplicado de follow en < 2 min bloqueado (anti-spam). | ⚠️ | Manual | Manual por ahora: depende de mensaje/flujo exacto de negocio y tiempo entre intentos. |

## 6) Logging de moderación técnica

| Punto crítico | Estado | Cobertura | Nota |
|---|---|---|---|
| Bloqueos por rate limit generan `rate_limit_blocked`. | ⚠️ | Manual | Smoke valida `429`, pero no inspecciona stdout estructurado en aserción formal. |
| Bloqueos por spam generan `spam_blocked`. | ⚠️ | Manual | Requiere test de captura de logs o test e2e con hook de logger. |

## Ejecución CI local

```bash
npm run regression:mvp
```

Salida legible esperada:
- líneas por check con `✅ / ⚠️ / ❌`
- resumen final `PASS/FAIL/SKIP`



## 7) Trazabilidad item por item (checklist -> prueba)

| ID | Item | Tipo | Evidencia |
|---|---|---|---|
| AUTH-01 | Register crea usuario | Automatizada | `integration.smoke.ts` -> bloque "Auth register/login" (`register A`, `register B`). |
| AUTH-02 | Login devuelve token | Automatizada | `integration.smoke.ts` -> `login A` y `login B`. |
| AUTH-03 | Login inválido = 401 | Automatizada | `integration.smoke.ts` -> `badLogin`. |
| AUTH-04 | Rate limit registro = 429 | Automatizada | `integration.smoke.ts` -> bloque "Auth rate limit (register)". |
| AUTH-05 | Rate limit login = 429 | Manual justificado | Se deja manual para evitar falsos negativos por ventana temporal compartida de límites por IP/usuario en la misma suite smoke. |
| COM-01 | GET communities 200 | Manual justificado | Validación local con datos semilla (`Invoke-RestMethod /api/communities`) para no acoplar smoke a estado de seed externo. |
| COM-02 | Comunidades semilla esperadas | Manual justificado | Requiere entorno local con seed y revisión de contenido exacto. |
| COM-03 | UI comunidades sin mocks | Manual justificado | Requiere validación visual web end-to-end. |
| POST-01 | GET posts lista publicaciones | Automatizada | `integration.smoke.ts` -> `postsBefore`. |
| POST-02 | POST posts sin token = 401 | Automatizada | `integration.smoke.ts` -> `createPostNoToken`. |
| POST-03 | POST posts con token crea publicación | Automatizada | `integration.smoke.ts` -> `createPost`. |
| CMT-01 | GET comments por post | Automatizada | `integration.smoke.ts` -> `listCommentsRes`. |
| CMT-02 | POST comment con token | Automatizada | `integration.smoke.ts` -> `createCommentRes`. |
| CMT-03 | Rate limit comments (8/min user) | Automatizada | `integration.smoke.ts` -> bloque "Comment limits". |
| POST-04 | Rate limit posts (3/min user) | Manual justificado | Pendiente prueba dedicada para no contaminar límites globales de la suite base. |
| QST-01 | GET questions | Manual justificado | Fuera del alcance de esta suite expandida; no se modifica flujo de questions en este cambio. |
| QST-02 | POST questions con token | Manual justificado | Pendiente suite específica de preguntas/respuestas. |
| QST-03 | POST answers con token | Manual justificado | Pendiente flujo completo pregunta->respuesta estable. |
| FOL-01 | Follow crea relación | Automatizada | `integration.smoke.ts` -> `followRes`. |
| FOL-02 | isFriend mutuo | Automatizada | `integration.smoke.ts` -> `followBackRes` + validaciones `relationship.isFriend` en ambos perfiles. |
| FOL-03 | Unfollow revierte relación | Automatizada | `integration.smoke.ts` -> `unfollowRes` + validaciones posteriores. |
| FOL-04 | Lista friends 200 | Automatizada | `integration.smoke.ts` -> `friendsList`. |
| FOL-05 | Rate limit follows | Manual justificado | Pendiente suite dedicada para no interferir con otras pruebas anti-spam/rate-limit. |
| FOL-06 | Anti-spam duplicado follow | Manual justificado | Depende de ventana temporal exacta de negocio; mejor validación manual controlada por tiempo. |
| LOG-01 | Log `rate_limit_blocked` | Manual justificado | Smoke valida HTTP 429 pero no aserta stdout estructurado. |
| LOG-02 | Log `spam_blocked` | Manual justificado | Requiere captura formal de logger o hook e2e de observabilidad. |
