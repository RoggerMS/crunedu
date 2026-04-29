# Checklist manual de regresión (MVP actual)

## 1) Auth
- [ ] `POST /api/auth/register` crea usuario nuevo.
- [ ] `POST /api/auth/login` devuelve `accessToken` válido.
- [ ] Login con contraseña inválida responde `401`.

## 2) Communities
- [ ] `GET /api/communities` responde `200`.
- [ ] Devuelve comunidades reales: Cachimbos, Apuntes, Trámites, General.
- [ ] Frontend `/app/comunidades` muestra datos reales sin mocks.

## 3) Feed (posts)
- [ ] `GET /api/posts` lista publicaciones publicadas.
- [ ] `POST /api/posts` sin token responde `401`.
- [ ] `POST /api/posts` con token crea publicación ligada a usuario/comunidad.
- [ ] `GET /api/posts/:id/comments` lista comentarios.
- [ ] `POST /api/posts/:id/comments` con token crea comentario.

## 4) Questions
- [ ] `GET /api/questions` lista preguntas.
- [ ] `POST /api/questions` con token crea pregunta.
- [ ] `POST /api/questions/:id/answers` con token crea respuesta.

## 5) Rate limiting y anti-spam (escritura)
- [ ] `POST /api/auth/register`: luego de 5 intentos en 1 minuto por IP responde `429` con mensaje claro en español.
- [ ] `POST /api/auth/login`: luego de 8 intentos en 1 minuto por IP responde `429` con mensaje claro en español.
- [ ] `POST /api/posts`: límite de 3 por minuto por usuario autenticado (y 10 por IP).
- [ ] `POST /api/posts/:id/comments`: límite de 8 por minuto por usuario autenticado (y 20 por IP).
- [ ] `POST /api/follows/:userId`: límite de 12 por minuto por usuario autenticado (y 20 por IP).
- [ ] Publicar dos veces el mismo contenido en menos de 2 minutos responde error anti-spam.
- [ ] Comentar dos veces el mismo contenido en menos de 2 minutos responde error anti-spam.
- [ ] Los bloqueos por rate limit y spam generan logs estructurados (`rate_limit_blocked` / `spam_blocked`) para análisis de moderación.
