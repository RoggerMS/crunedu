# PROFILE_IMPLEMENTATION_STATUS.md — Sistema de Perfiles CrunEdu

Alta: 2026-06-30. Modulo objetivo: Users/Profile (frontend + backend). Estado inicial: En progreso.

## 1. Diagnóstico inicial

### Estado actual
- `Profile` existe en `schema.prisma` con campos base: `firstName`, `lastName`, `avatarUrl`, `avatarStorageKey`, `description`, `universityId`, `facultyId`, `careerId`, `cycle`.
- **No existe** `username`, `headline`, `coverUrl`, `coverStorageKey`, `coverPositionY`, ni campos personales (ciudad, nacimiento, género, etc.).
- **No existe** enum `PostVisibility`. `Post.inFeed` controla distribución pero no audiencia.
- **No existen** tablas de información ampliada (formación, empleo, intereses, idiomas, enlaces, lugares, detalles, destacados, secciones, privacidad).
- **No existe** cliente MinIO en la API. Todos los uploads (posts, questions, moments, documents, marketplace, conversations) usan filesystem local `tmp/uploads/`. Docker-compose ya expone variables `MINIO_*`.
- Frontend: `/app/perfil` y `/app/perfil/[id]` usan el mismo componente `PublicProfile` (buena base unificada), pero es estático: sin pestañas, sin reutilizar `PostCard`, sin upload de avatar/portada.
- `MAIN_NAVIGATION` incluye "Mi perfil" y "Configuración de perfil".
- `app-shell.tsx` no muestra avatar real en la cabecera; usa `UserCircle2` genérico.
- `FeedAuthor` (shared) no incluye `avatarUrl`; `mapApiPostToFeedPost` no propaga avatar.
- `getFriends`/`getFollowers`/`getFollowing` en `UsersService` calculan relación con N+1 (`Promise.all` + `getRelationship` por usuario).

### Modelos existentes aprovechables
- `Profile` (base a extender).
- `Follow` (con índices compuestos ya definidos).
- `Post` + `PostImage` (reutilizable para multimedia y publicaciones de perfil).
- `Report` (reutilizable para reportar perfiles).
- `Notification` (reutilizable para nuevos seguidores).

### Endpoints existentes
- `GET /users/me`, `PATCH /users/me` (campos limitados).
- `GET /users/:id` (perfil público básico).
- `GET /users/:id/followers|following|friends` (sin paginación, N+1).
- `POST /follows/:userId`, `DELETE /follows/:userId`.
- Posts: `GET /posts`, `POST /posts`, `GET /posts/:id`, like/save/share/comment/edit/delete.

### Componentes reutilizables (frontend)
- `PostCard`, `PostActions`, `FeedMediaGallery`, `FeedMediaViewer`, `FeedPostModal`, `FeedComposer`, `CreatePostModal`.
- `apiRequest` (http-client.ts) con inyección automática de Bearer token.
- `useAuth` con `refreshUser()`.
- `PublicProfile` (base unificada propia/público).
- `ProfileSettingsPanel` (configuración básica a reestructurar).

### Problemas detectados
1. Sin almacenamiento MinIO — todos los archivos en filesystem local (se pierden al reconstruir contenedor sin volumen).
2. Sin privacidad de publicaciones — todo es público o no existe.
3. N+1 en listas de seguidores/seguidos/amigos.
4. `FeedAuthor` sin avatar → autores sin foto en toda la plataforma.
5. Sin `UserIdentityLink` — cada componente renderiza avatar+nombre ad-hoc.
6. Sin pestañas en perfil — no hay Publicaciones/Información/Multimedia/Comunidades.
7. "Mi perfil" y "Configuración de perfil" saturan el menú principal.
8. Sin avatar real en cabecera de escritorio.

## 2. Arquitectura elegida

- **Un solo perfil**: `PublicProfile` reutilizable para propio y ajeno, diferenciado por `isMine` + relación + permisos.
- **Rutas**: `/app/perfil` (alias del propio), `/app/perfil/[id]` (cualquier usuario), `/app/configuracion-perfil` (edición).
- **Almacenamiento**: MinIO via `StorageService` nuevo (bucket `crunedu-local`), claves `avatars/<random>.ext` y `covers/<random>.ext`.
- **Privacidad**: enum `PostVisibility` (PUBLIC/FOLLOWERS/FRIENDS/ONLY_ME) + campo `visibility` en `Post`. `inFeed` controla distribución; `visibility` controla audiencia.
- **Información ampliada**: tablas relacionales (ProfileEducation, ProfileEmployment, etc.) — no JSON arbitrario.
- **Amistad**: mutua = A sigue a B AND B sigue a A. Sin solicitudes.
- **Batch relaciones**: calcular `isFollowing`/`isFollowedBy`/`isFriend` en lotes con una sola consulta por dirección.

## 3. Fases de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Schema + migración no destructiva (Profile extendido, PostVisibility, tablas info) | En progreso |
| 2 | MinIO StorageService + avatar/cover upload/delete + endpoints perfil extendido | Pendiente |
| 3 | FeedAuthor avatarUrl + UserIdentityLink + cambios navegación | Pendiente |
| 4 | Página perfil unificada con pestañas + reutilización PostCard + compositor | Pendiente |
| 5 | Seguidores/seguidos/amigos con paginación + privacidad listas | Pendiente |
| 6 | Multimedia + destacados + comunidades + secciones configurables | Pendiente |
| 7 | Autores clicables en todos los módulos + responsive + pruebas | Pendiente |
