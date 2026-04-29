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
