# Questions Backend Integration Plan

## Module objective

Preguntas is the educational Q&A forum where students ask academic doubts, share
exercises, and receive step-by-step help. It must work as a dedicated module with
its own backend, while remaining structurally connected to Communities and the
Feed for future cross-posting.

## Current state detected (2026-06-19)

### Backend (already robust)
- `GET /api/questions` — cursor pagination, public read.
- `GET /api/questions/:id` — detail with answers, public read.
- `POST /api/questions` — JWT protected, validates `communityId`.
- `POST /api/questions/:id/answers` — JWT protected.
- `POST /api/questions/:id/answers/:answerId/vote` — JWT protected, up/down/undo.
- `PATCH /api/questions/:id/answers/:answerId/useful` — JWT, only question author.
- `POST /api/questions/images` + `POST /api/questions/answers/images` — image uploads.
- Prisma models `Question`, `Answer`, `AnswerVote`, `QuestionImage`, `AnswerImage` exist.

### Frontend (mostly connected)
- `/app/preguntas` — calls `GET /api/questions` via `useQuestions` hook.
- `/app/preguntas/nuevo` — calls `POST /api/questions` with real token.
- `/app/preguntas/[id]` — calls `GET /api/questions/:id`, creates answers, votes,
  marks useful, reports. All real API calls.

### Issues fixed in this task
- Removed mock fallback (`initialQuestions` with fake users) from `useQuestions`.
- Removed "Modo demo" banner from list page.
- Added `communityId`, `q`, `status` filters to `GET /api/questions`.
- Added `PATCH /api/questions/:id` (edit own question).
- Added `DELETE /api/questions/:id` (soft-delete own question or admin).
- Added rate limiting to `create` and `createAnswer`.
- Added `isMine` to question response (enables edit/delete UI).
- Fixed `useQuestions.addQuestion`/`addAnswer` to use real token.
- Removed "Guía completa pendiente" button from tips card.

## Data model (existing, no schema changes needed)

### Question
- `id`, `title`, `content`, `userId`, `communityId?`, `status`, `isResolved`,
  `createdAt`, `updatedAt`.
- Relations: `author -> User`, `community -> Community?`, `answers -> Answer[]`,
  `images -> QuestionImage[]`.

### Answer
- `id`, `content`, `questionId`, `userId`, `isUseful`, `status`, `createdAt`,
  `updatedAt`.
- Relations: `question -> Question`, `author -> User`, `votes -> AnswerVote[]`,
  `images -> AnswerImage[]`.

### AnswerVote
- `id`, `answerId`, `userId`, `value` (-1 | 1), timestamps.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/questions` | Optional JWT | List with `communityId`, `q`, `status`, `cursor`, `limit` |
| GET | `/api/questions/:id` | Optional JWT | Detail with answers |
| POST | `/api/questions` | JWT | Create question |
| PATCH | `/api/questions/:id` | JWT | Edit own question (author or admin) |
| DELETE | `/api/questions/:id` | JWT | Soft-delete own question (author or admin) |
| POST | `/api/questions/:id/answers` | JWT | Create answer |
| POST | `/api/questions/:id/answers/:answerId/vote` | JWT | Vote answer |
| PATCH | `/api/questions/:id/answers/:answerId/useful` | JWT | Mark/unmark useful (author only) |
| POST | `/api/questions/images` | JWT | Upload question image |
| POST | `/api/questions/answers/images` | JWT | Upload answer image |

## Future integration with Inicio, Communities, Apuntes

### Inicio / Feed (Phase 2 — not implemented)
- Currently the feed is based on `Post` model. Questions are a separate model.
- Future: when creating a question, optionally create a `Post` of type
  `shared_question` that references the question, so it appears in the feed.
- Or: extend the feed service to union `Post` + `Question` results.
- The `FeedPostType` enum already includes `"shared_question"`.

### Communities (partially ready)
- `Question.communityId` exists and is validated on create.
- `GET /api/questions?communityId=<id>` now filters by community.
- Future: add a "Preguntas" tab inside community detail that calls this filter.

### Apuntes (Phase 3 — not implemented)
- If a question includes a PDF/document in the future, that file could create a
  `Document` record linked to the question's community.
- Would require: `Attachment` model, upload infrastructure, `Note` ↔ `Question`
  relation, visibility rules.
- No file uploads beyond images are implemented yet.

## Implementation phases

### Phase 1 (this task) — Backend completion + frontend cleanup
- [x] Add `communityId`, `q`, `status` filters to list endpoint.
- [x] Add `PATCH /api/questions/:id` and `DELETE /api/questions/:id`.
- [x] Add rate limiting to question and answer creation.
- [x] Add `isMine` to response for frontend conditional UI.
- [x] Remove mock data fallback from frontend.
- [x] Fix token usage in `useQuestions` hook.
- [x] Clean up list page (no "Modo demo", honest empty/error states).
- [x] Add delete option in detail page when `isMine`.

### Phase 1b (2026-06-19) — WYSIWYG editor + UX redesign
- [x] Implement `status=answered` filter in `QuestionsService.index`
      (`open` = not resolved + no published answers, `answered` = not
      resolved + has published answers, `resolved` = isResolved).
- [x] Add `viewerVote` to answer mapper (computed from votes by viewer id).
- [x] Add `canMarkUseful` to question response (author or admin/moderator).
- [x] Pass viewer `role` to `index`/`findOne` via OptionalJwtAuthGuard.
- [x] Change permission error in `markAnswerUseful` to `ForbiddenException`.
- [x] Replace Markdown "Escribir/Vista previa" editor with WYSIWYG
      `RichAcademicEditor` (contentEditable + execCommand, no preview tab).
- [x] Toolbar: negrita, cursiva, subrayado, listas, símbolos, ecuaciones, imagen.
- [x] `SymbolPicker` with 8 categories (potencias, operaciones, relaciones,
      flechas/lógica, conjuntos, griegas, cálculo, geometría/unidades).
- [x] `EquationPicker` with frequent structures (x², √x, fracción, ∑, ∫, lim...).
- [x] Insert at cursor position; paste as plain text.
- [x] `AcademicContentRenderer` now renders sanitized HTML (new content) AND
      legacy Markdown (old questions) for backward compatibility.
- [x] `html-utils.ts`: server-safe `sanitizeHtml` (allowlist via DOMParser,
      strips scripts/on-handlers/img/a), `htmlToPlainText`, `looksLikeHtml`.
- [x] List page 3-zone layout: left subjects rail, center ask+search+list,
      right user summary + tips + collaborator ranking + sidebar.
- [x] Responsive: single column on mobile, no global horizontal scroll.
- [x] `QuestionCard` redesign: author, course, relative date, status badge,
      answers/votes stats, attached image, 3-dot menu (copy/report/delete if
      mine), "Ayudar / Responder" button.
- [x] `nuevo` page: community/asignatura selector (`useCommunities`),
      rich editor, plain-text validation via `htmlToPlainText`.
- [x] `[id]` detail: `ImageGallery` (main + thumbnails + lightbox), answers
      sorted (useful first, then votes, then date), up/down vote buttons with
      `viewerVote` state, mark-useful gated by `canMarkUseful` (hidden for
      non-authors), report question/answer, answer editor with templates
      ("Respuesta final" / "Procedimiento").
- [x] `CollaboratorRankingCard` computed from accepted answers (no points
      system needed; uses existing `Answer.isUseful`).

### Phase 2 (future) — Feed integration
- [ ] Show questions in feed as `shared_question` items.
- [ ] Composer "Pregunta" button creates real question (currently redirects to
      `/app/preguntas/nuevo`).
- [ ] Community detail "Preguntas" tab using `?communityId` filter.

### Phase 3 (future) — Apuntes / attachments
- [ ] PDF/document upload for questions.
- [ ] Auto-create `Document` record when a question has a PDF.
- [ ] Show question-linked documents in Apuntes.
- [ ] Cross-publish from Apuntes to Feed/Community.

## Deferred (require schema work — not in MVP scope)

- **Points system** (Brainly-style): `User`/`Profile` has no points field and
  no points history model. Implementing offered points + delivery on accept
  would need a migration and transactional logic. Left as documented pending.
  The UI shows no fake points counters.
- **Save / follow questions**: no `SavedQuestion`/follow-for-questions model
  exists. "Guardar/seguir" buttons are NOT shown to avoid fake UI. "Copiar
  enlace" and "Reportar" are the available actions.
- **Subject model**: `Question` uses `communityId`, not `subjectId`. For MVP
  the left rail uses the visual `QUESTION_COURSES` list + real communities as
  the filter. A dedicated `Subject` model is deferred.

## Risks
- Feed does not show questions yet (separate models, no union query).
- Composer "Pregunta" in feed redirects to `/app/preguntas/nuevo` instead of
  creating inline — acceptable for MVP but not unified.
- No notification when a question receives an answer (notifications module not
  implemented).
- `vote` and `save` on `QuestionItem` in the list page are local-only (no
  backend vote/save for questions, only for answers).
- Image uploads use local filesystem (`tmp/uploads/`), not MinIO/S3.
- WYSIWYG editor uses `document.execCommand` (deprecated but widely supported)
  and `contentEditable`; rich pasting is forced to plain text for safety.
- HTML content is sanitized via an allowlist (`html-utils.sanitizeHtml`) before
  rendering with `dangerouslySetInnerHTML`; legacy Markdown questions still
  render through the old block parser.
- Points / save-follow / dedicated subjects are deferred (see above).
