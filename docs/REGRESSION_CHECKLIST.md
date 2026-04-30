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

