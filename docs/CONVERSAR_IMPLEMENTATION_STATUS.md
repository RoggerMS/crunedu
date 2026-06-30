# Conversar — Estado de implementación

Alta: 2026-06-30. Módulo objetivo: **Conversar** (salas de audio universitarias en tiempo real).

## 1. Diagnóstico inicial

### Partes simuladas (mocks)
- `apps/web/src/modules/conversar/mock-data.ts` contiene: `mockConversations`, `mockParticipants`, `mockRecordings`, `mockCompanions`, `mockMaterials`, `mockSharedLinks`, `mockDebateStances`.
- Las grabaciones mock usan URLs falsas `https://audio.crunedu.local/...` que no existen.
- Los materiales mock usan `https://files.crunedu.local/...`.
- Ningún dato proviene de PostgreSQL.

### Botones que no funcionan (acciones locales sin backend)
- Crear conversación (`/app/conversar/nueva`): `handleFakeSubmit` o equivalente local.
- Entrar a sala (`/app/conversar/[id]`): sin token LiveKit, sin conexión de audio real.
- Levantar la mano / aprobar / rechazar: cambios de estado locales.
- Silenciar / retirar / bloquear: sin efecto en permisos reales.
- Materiales / enlaces: sin persistencia.
- Grabaciones: `ConversarAudioPlayerMock` reproduce URLs inexistentes.
- Compañeros: `mockCompanions`, sin opt-in real.
- "Avisarme cuando empiece": sin suscripción persistente.
- Debate: posturas/argumentos simulados.

### Rutas que utilizan mocks
- `/app/conversar` (importa `mockConversations`, muestra banner "Salas de Audio en desarrollo").
- `/app/conversar/en-vivo`, `/en-espera`, `/debates`, `/companeros`, `/grabaciones`, `/temas`.
- `/app/conversar/[id]`, `/[id]/debate`, `/[id]/finalizada`.
- `/app/conversar/nueva`.

### Backend existente
- **No existe** módulo `conversations` en `apps/api`.
- No hay controladores, servicios ni DTOs para conversaciones.
- `app.module.ts` no registra ningún módulo de conversar.

### Modelos existentes
- **No existe** ningún modelo `Conversation*` en `schema.prisma`.
- Existen: `User`, `Profile` (con `universityId`, `facultyId`, `careerId`), `University`, `Notification`, `ModerationLog`, `Report`.

### Infraestructura faltante
- **LiveKit**: no está en `docker-compose.yml`. No hay `LIVEKIT_*` vars.
- **LiveKit Egress**: no existe. Grabaciones no son posibles.
- **Dependencias**: `livekit-server-sdk` (api) y `livekit-client` + `@livekit/components-react` (web) no están instaladas.
- **MinIO**: el contenedor existe, pero el código actual usa sistema de archivos local (`tmp/uploads`) para documentos. Se reutilizará el mismo patrón de almacenamiento local para materiales/grabaciones en dev (consistencia), dejando la estructura lista para MinIO.

### Patrones del repositorio a respetar
- Auth: `JwtAuthGuard` / `OptionalJwtAuthGuard` con `DevSecurityService` (relaxed auth en dev). Payload `{ sub, email, role }`.
- Módulos NestJS: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `JwtSharedModule`, `PrismaModule`.
- Rate limiting: `@RateLimit({ windowMs, maxPerIp, maxPerUser, message })`.
- Paginación: cursor-based, `PAGINATION_LIMITS`.
- Frontend: `apiRequest` desde `apps/web/src/lib/http-client.ts`; capa `*-api.ts` (ej. `moments-api.ts`).
- Almacenamiento: `tmp/uploads/<folder>/<filename>` + `fileUrl`/`storageKey`, servido vía `StreamableFile`.
- `main.ts`: prefijo global `/api`, CORS para `localhost:3000`, `ValidationPipe` con `whitelist`+`forbidNonWhitelisted`+`transform`.

## 2. Arquitectura a implementar

```
Navegador (Next.js + livekit-client)
   │  GET/POST /api/conversations/*  (NestJS, JWT)
   ▼
NestJS API ──► PostgreSQL (persistencia: Conversation, Participant, SpeakerRequest, ...)
   │  genera token LiveKit de corta duración (livekit-server-sdk)
   │  permisos por rol (listener no publica audio, speaker sí)
   ▼
LiveKit (SFU audio) ──► WebRTC audio entre participantes
   │  (opcional) Egress graba audio mezclado → archivo
   ▼
Almacenamiento (tmp/uploads en dev / MinIO-ready) + metadatos en PostgreSQL
```

Fuentes de verdad:
- **PostgreSQL**: información persistente (salas, participantes, roles, materiales, enlaces, grabaciones, debates, compañeros, invitaciones, bans, suscripciones).
- **LiveKit**: estado efímero de la sesión de audio (conectado, pistas, micrófono, hablante activo, calidad).
- **Redis** (existente): rate limiting / caché transitorio cuando aplique.

## 3. Fases previstas

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Auditoría, modelos, migración, backend CRUD, permisos, pruebas API | En progreso |
| 2 | Frontend: API client, hooks, eliminación de mocks, creación, listados, detalle, borradores | Pendiente |
| 3 | LiveKit: Docker, token, unión, audio, participantes, reconexión | Pendiente |
| 4 | Levantar mano, roles, moderación, sala bloqueada, finalización | Pendiente |
| 5 | Sala de estudio, pregunta, debate, materiales, enlaces | Pendiente |
| 6 | Egress, grabaciones, reproductor | Pendiente |
| 7 | Compañeros, invitaciones, aviso de inicio, página finalizada | Pendiente |
| 8 | Responsive, accesibilidad, pruebas, documentación, limpieza | Pendiente |

## 4. Progreso de implementación

### Fase 1 — Data layer + backend ✅
- [x] Modelos Prisma: 13 modelos (Conversation, ConversationParticipant, ConversationSpeakerRequest, ConversationInvite, ConversationBan, ConversationMaterial, ConversationSharedLink, ConversationRecording, ConversationDebateStance, ConversationDebateMembership, ConversationDebateArgument, ConversationCompanionProfile, ConversationStartSubscription).
- [x] Migración `20260630000000_conversations_module` aplicada + baseline de migraciones existentes.
- [x] Módulo `apps/api/src/modules/conversations/` completo (service, controller, livekit, recordings, permissions, constants, 10 DTOs).
- [x] Endpoints: CRUD, drafts, lifecycle (start/end/cancel/join/leave), speaker requests, moderation (role/mute/remove/ban/lock), invites, materials (upload/serve/delete), links, recordings (list/detail/play/start/stop/delete), start-subscriptions, debates (stances/join/arguments), companions.
- [x] `ConversationsLivekitService` (token generation con permisos por rol).
- [x] `ConversationsRecordingsService` (Egress con degradación graceful).
- [x] Registro en `app.module.ts`.
- [x] Pruebas `test:conversations`: **28 passed, 0 failed**.

### Fase 2 — Frontend ✅
- [x] `apps/web/src/lib/conversations-api.ts` (cliente API completo, ~40 funciones).
- [x] Hooks: `useConversations`, `useConversationDetail`, `useLiveKitConversation`.
- [x] `apps/web/src/modules/conversar/adapters.ts` (adaptadores API → componentes).
- [x] Portada real (`/app/conversar`): banner eliminado, datos reales, búsqueda, filtros, auto-refresh.
- [x] Formulario `/nueva` real: validación, crear, guardar borrador, posturas debate, grabación opcional.
- [x] Listados reales: en-vivo, en-espera, debates, grabaciones, companeros.
- [x] `ConversarAudioPlayer` real (play/pause/seek/volumen/velocidad/reiniciar).
- [x] `ConversarStates` (skeleton/error/empty/loading).

### Fase 3 — LiveKit ✅
- [x] `docker-compose.yml`: servicio `livekit` (v1.8.0) con healthcheck.
- [x] `docker-compose.yml`: servicio `livekit-egress` (v1.8.0) con profile `egress`.
- [x] `livekit-client` + `@livekit/components-react` en web; `livekit-server-sdk` en api.
- [x] `docker/livekit/livekit.yaml` (config local dev).
- [x] Variables: `LIVEKIT_*`, `NEXT_PUBLIC_LIVEKIT_URL`, `NEXT_PUBLIC_CONVERSAR_USE_MOCKS`.
- [x] Unión a sala con token temporal, audio real, participantes, micrófono, mano, salir.
- [x] LiveKit server verificado: healthy, tokens de 512 chars generados.

### Fase 4 — Moderación y roles ✅
- [x] Levantar mano (crear/cancelar solicitudes).
- [x] Aprobar/rechazar solicitudes (cambia rol a SPEAKER).
- [x] Silenciar/retirar/bloquear/desbloquear participantes.
- [x] Bloquear/desbloquear sala.
- [x] Cambiar roles (host → moderator/speaker/listener).
- [x] Finalizar conversación (desconecta LiveKit, marca ENDED).

### Fase 5 — Estudio, pregunta, debate, materiales, enlaces ✅
- [x] Sala de estudio (type=STUDY): materiales, descripción, objetivo.
- [x] Pregunta (type=QUESTION): conclusión editable, vista finalizada.
- [x] Debate (type=DEBATE): posturas, unirse, argumentos, proponer nuevas, página dedicada.
- [x] Materiales: upload a filesystem (PDF/DOCX/PPTX/imagen), serve via StreamableFile, delete.
- [x] Enlaces: validación HTTPS, dominio, tipos, rel="noopener noreferrer".

### Fase 6 — Grabaciones ✅ (parcial)
- [x] Backend: start/stop recording, list, detail, play (count), delete.
- [x] Egress service configurado (profile `egress`, desactivado por defecto).
- [x] Estados: REQUESTED/RECORDING/PROCESSING/AVAILABLE/FAILED/DELETED.
- [x] Reproductor real `ConversarAudioPlayer`.
- [ ] **Pendiente**: activar Egress con `--profile egress` y verificar grabación real end-to-end.

### Fase 7 — Compañeros, invitaciones, aviso, finalizada ✅
- [x] Compañeros: perfil opt-in (upsert/get/delete), listado con filtros, datos reales.
- [x] Invitaciones: token hasheado (SHA-256), expiración, revocación, max uses.
- [x] Avisarme cuando empiece: suscripción persistente, notificación al iniciar.
- [x] Página finalizada: datos reales, grabación, materiales, enlaces, posturas, conclusión.

### Fase 8 — UX, documentación ✅
- [x] Skeletons, estados vacío, error con reintentar.
- [x] Indicadores de conexión (conectando/conectado/reconectando/error).
- [x] Indicador de grabación.
- [x] Controles táctiles (h-14 w-14 = 56px > 44px mínimo).
- [x] Controles sticky en底部 (micrófono/mano/salir/finalizar).
- [x] Navegación por teclado (aria-label, focus visible).
- [x] `NEXT_PUBLIC_CONVERSAR_USE_MOCKS=false` por defecto.
- [x] Seed: 3 conversaciones + 1 perfil compañero.
- [x] Documentación: `.env`, `.env.example`, este documento.

## 5. Verificación realizada

| Verificación | Resultado |
|---|---|
| `prisma validate` | ✅ Schema válido |
| `prisma migrate deploy` | ✅ Migración aplicada |
| `prisma generate` | ✅ Cliente generado |
| API typecheck (`tsc --noEmit`) | ✅ 0 errores |
| Web typecheck (`tsc --noEmit`) | ✅ 0 errores |
| `test:conversations` | ✅ 28 passed, 0 failed |
| `GET /api/conversations` | ✅ 200, 4 items |
| `GET /api/conversations/live` | ✅ 200 |
| `GET /api/conversations/waiting` | ✅ 200, 1 item |
| `GET /api/conversations/debates` | ✅ 200, 1 item |
| `GET /api/conversation-companions` | ✅ 200, 1 item |
| `POST /api/conversations` (create) | ✅ 201 |
| `POST /api/conversations/:id/join` | ✅ 201, token 512 chars |
| `POST /api/conversations/:id/start` | ✅ 200, status=LIVE |
| LiveKit server | ✅ healthy (v1.8.0) |
| Web `/app/conversar` | ✅ 200 |
| Web `/app/conversar/nueva` | ✅ 200 |
| Web `/app/conversar/en-vivo` | ✅ 200 |
| Web `/app/conversar/companeros` | ✅ 200 |
| Web `/app/conversar/grabaciones` | ✅ 200 |
| Web `/app/conversar/[id]` | ✅ 200 |
| Web `/app/conversar/[id]/debate` | ✅ 200 |
| Web `/app/conversar/[id]/finalizada` | ✅ 200 |

## 6. Notas / riesgos
- **Grabaciones**: Egress está configurado pero desactivado por defecto (`LIVEKIT_EGRESS_ENABLED=false`). Para activar: `docker compose --profile egress up -d` y set `LIVEKIT_EGRESS_ENABLED=true` en `.env`. Si Egress no logra grabar, la grabación queda en estado FAILED con el error documentado (no se simula).
- **Build de producción**: `next build` tiene errores de prerendering (`useContext` null) en páginas preexistentes (comunidades, apuntes, not-found) — no introducidos por este módulo. El dev server (`next dev`) funciona correctamente.
- **Almacenamiento**: materiales y grabaciones usan filesystem local (`tmp/uploads`) en dev, consistente con el módulo de documentos. La estructura (`storageKey`) está lista para migrar a MinIO.
- **LiveKit UDP**: rango 50100-50200 configurado para evitar puertos excluidos por Windows.
- **Mocks**: `mock-data.ts` se conserva solo para Storybook/tests. Ninguna página productiva lo importa. `NEXT_PUBLIC_CONVERSAR_USE_MOCKS=false` por defecto.
- **Prueba manual con dos usuarios**: pendiente de ejecutar localmente por el usuario (requiere dos navegadores). Instrucciones en la sección de entrega.
