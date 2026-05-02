# AGENTS.md — CrunEdu

## 1. Project context

CrunEdu is an independent educational social network for university students, initially focused on students from La Cantuta.

CrunEdu is not an official university platform, not an official university website, and not a formal LMS.

The MVP must stay simple, modular, maintainable, and verifiable.

The main product goal is to help students solve real university problems through communities, posts, questions, answers, comments, useful guides, allowed notes/documents, student procedures, university moments, and a basic store managed by CrunEdu.

The platform should first become useful for students from La Cantuta before expanding to other universities.

## 2. Tech stack

Current monorepo:

- `apps/web`: Next.js + React + TypeScript + Tailwind CSS
- `apps/api`: NestJS + TypeScript
- `packages/database`: Prisma + PostgreSQL
- `packages/shared`: shared TypeScript types and constants
- `packages/ui`: shared UI package if used by the repo

User local environment:

- Windows 11
- VS Code
- Docker Desktop
- Repository path: `C:\GITHUB\crunedu`

Local Docker Compose services:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- PostgreSQL: `5432`
- Redis: `6379`
- MinIO API: `9000`
- MinIO Console: `9001`
- Mailhog UI: `8025`
- Mailhog SMTP: `1025`

## 3. Current confirmed state

The following has already been confirmed locally by the user:

- Docker works.
- API works.
- `GET http://localhost:4000/api/health` works.
- Prisma migrate worked.
- Prisma seed worked.
- Admin user exists:
  - email: `admin@crunedu.local`
  - password: `CrunEdu123!`
- Register works:
  - `POST http://localhost:4000/api/auth/register`
- Login works:
  - `POST http://localhost:4000/api/auth/login`
  - returns an `accessToken` JWT.
- Communities module is functional.
- `GET http://localhost:4000/api/communities` returns real communities from PostgreSQL:
  - Cachimbos
  - Apuntes
  - Trámites
  - General
- The frontend page `/app/comunidades` has been connected to consume real communities.
- `.dockerignore` was created or corrected to prevent Docker from including `node_modules`, `.next`, `dist`, and similar folders.
- The Docker error `invalid file request node_modules/@crunedu/api` was solved by using `.dockerignore`.

Preserve all working functionality.

## 4. Important note about Codex cloud

Codex cloud runs in a separate Linux environment.

Do not assume that `localhost:3000` or `localhost:4000` inside Codex cloud refers to the user's local Windows Docker environment.

The user's local services run on Windows 11 through Docker Desktop.

Therefore:

- If `curl localhost:4000` fails inside Codex cloud, it does not mean the user's local API is broken.
- If `curl localhost:3000` fails inside Codex cloud, it does not mean the user's local frontend is broken.
- Runtime verification with Docker is usually done by the user locally unless the complete stack is explicitly started inside Codex.
- Prefer static checks, code inspection, lint, typecheck, and build commands inside Codex.
- When local runtime verification is needed, provide exact PowerShell commands for the user to run locally.

## 5. Hard rules

Always follow these rules:

- Never run `docker compose down -v`.
- Never delete Docker volumes.
- Never reset, wipe, or drop the database unless the user explicitly approves it.
- Never run destructive commands without explicit approval.
- Do not change `schema.prisma` unless strictly necessary for the requested MVP task.
- Do not implement features outside the requested MVP module.
- Do not build a full marketplace yet.
- Do not implement external sellers yet.
- Do not implement automatic payments yet.
- Do not implement advanced cart logic yet.
- Do not implement commissions yet.
- Do not implement shipping integration yet.
- Do not implement chat yet.
- Do not implement notifications yet.
- Do not implement advanced file uploads yet.
- Do not add new production dependencies unless necessary.
- Do not run `npm audit fix --force`.
- Do not break auth.
- Do not break communities.
- Do not break Prisma seed.
- Do not break Docker setup.
- Keep code simple, modular, and readable.
- Technical code must be written in English.
- Visible UI copy must be written in Spanish.
- Work in small, verifiable steps.

Forbidden commands:

- `docker compose down -v`
- `docker volume rm`
- `docker system prune -a`
- `rm -rf *`
- `rm -rf node_modules package-lock.json`
- `git reset --hard`
- `git clean -fd`
- `npm audit fix --force`
- `npx prisma migrate reset`
- `npx prisma db push --force-reset`
- `dropdb`
- `truncate`

## 6. Safe commands and script rules

Before running any script, inspect the available scripts in:

- root `package.json`
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/database/package.json`
- `packages/shared/package.json`

Do not assume that `npm run typecheck`, `npm test`, or workspace commands exist before checking `package.json`.

Useful safe commands:

- `git status`
- `git diff`
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npx prisma validate`

Use only the commands that actually exist in the repository.

## 7. Local PowerShell commands for the user

When the user needs to verify locally on Windows, provide PowerShell commands.

Common local commands:

- `cd C:\GITHUB\crunedu`
- `docker compose ps`
- `docker compose logs web --tail=80`
- `docker compose logs api --tail=80`
- `docker compose up -d --build web`
- `docker compose up -d --build api`
- `Invoke-RestMethod http://localhost:4000/api/health`
- `Invoke-RestMethod http://localhost:4000/api/communities`

Do not tell the user to run `docker compose down -v`.

Do not tell the user to reset the database unless there is a clear approved reason.

## 8. Development workflow

For each task:

1. Inspect the existing structure first.
2. Reuse existing patterns.
3. Make the smallest possible change.
4. Avoid large refactors.
5. Avoid mixing unrelated changes.
6. Keep the module testable.
7. Validate with available lint, build, or typecheck commands.
8. Explain files changed.
9. Explain how to verify locally.
10. Stop after the requested task is complete.

Do not continue into the next module unless the user asks for it.

## 9. MVP order and current priority

The MVP should be implemented in this order:

1. Auth
2. Communities
3. Posts / feed
4. Comments / questions and answers
5. User profile
6. Useful guides / student procedures managed by CrunEdu
7. Basic search
8. Reports / moderation
9. Basic store managed by CrunEdu

Current priority after communities:

Posts / feed.

The next functional goal is:

- create or complete the posts backend
- expose `GET /api/posts`
- expose `POST /api/posts` protected by JWT
- show real posts in the frontend feed
- allow a logged-in user to create a basic post
- connect posts to user and community

Do not implement yet:

- likes
- reactions
- images
- advanced uploads
- comments
- reports
- notifications
- chat
- marketplace
- recommendation algorithm

## 10. Communities and posts rules

The communities module is already functional and must not be broken.

Current endpoint:

- `GET /api/communities`

Expected communities:

- Cachimbos
- Apuntes
- Trámites
- General

Frontend page:

- `/app/comunidades`

The page should display real data from the API, not placeholders or mock data.

When implementing posts:

1. Check whether a Prisma `Post` model already exists.
2. Check whether posts module files already exist in `apps/api`.
3. Reuse existing DTO, service, controller, and module patterns.
4. Do not change `schema.prisma` if a valid `Post` model already exists.
5. If `schema.prisma` must change, explain why before making the change.
6. Keep the first version minimal.
7. Use JWT auth for post creation.
8. Do not implement comments in the same step unless explicitly requested.
9. Do not implement likes in the same step.
10. Do not implement image uploads in the same step.

Recommended API endpoints:

- `GET /api/posts`
- `POST /api/posts`

Recommended `POST /api/posts` body:

{
"title": "string",
"content": "string",
"communityId": 1
}

Recommended first post fields:

- id
- title
- content
- createdAt
- author
- community
- commentsCount if already available, otherwise return 0

## 11. Store and future modules

CrunEdu will eventually include a basic store to help sustain the platform.

The first store version must be basic and managed only by CrunEdu.

Allowed later:

- products managed by CrunEdu
- product categories
- product detail page
- contact/order interest button
- simple admin-managed product listing

Not allowed yet:

- external sellers
- seller dashboards
- automatic payments
- advanced cart
- commissions
- shipping integration
- marketplace disputes
- complex inventory system

Useful guides/procedures should also be added later.

Examples:

- carné universitario
- matrícula
- comedor universitario
- constancias
- trámites por facultad
- documentos permitidos
- orientation for new students

Do not implement store or guides before posts and basic interaction work unless the user explicitly changes priority.

## 12. Language, UI, API, and definition of done

Use English for technical code:

- variables
- functions
- classes
- services
- DTOs
- filenames where appropriate
- database fields
- API internal names

Use Spanish for visible interface copy:

- buttons
- labels
- titles
- descriptions
- error messages
- empty states
- form helper text

Examples of visible Spanish UI:

- `Publicar`
- `Comunidades`
- `No hay publicaciones aún`
- `Error al cargar las comunidades`
- `Inicia sesión para publicar`
- `Selecciona una comunidad`
- `Contenido de la publicación`

UI rules:

- prioritize clarity over decoration
- use existing Tailwind patterns
- reuse existing components when possible
- avoid unnecessary animation
- avoid complex layouts
- make empty states clear
- make error states understandable
- keep mobile and desktop usable
- do not redesign the whole app unless requested

API rules:

- follow NestJS module structure
- use controllers, services, and DTOs
- validate request bodies where project patterns already support validation
- return predictable response shapes
- do not leak password hashes
- protect write endpoints with JWT where appropriate
- keep read endpoints public only when reasonable for the MVP

Database rules:

- `schema.prisma` is sensitive
- check whether the needed model or field already exists before modifying it
- explain the minimal required change before modifying it
- avoid broad schema redesigns
- avoid destructive migrations
- keep seed compatibility
- preserve existing data where possible

A task is complete only when:

- the requested scope is implemented
- unrelated modules are not changed
- existing working functionality is preserved
- files changed are listed
- validation commands are listed
- remaining risks are mentioned briefly
- local verification steps are provided to the user

After completing a task, respond with:

1. Summary
2. Files changed
3. Validation performed
4. Local verification steps
5. Notes / risks

Keep explanations clear and brief.

Do not exaggerate success if something was not verified.

Project mindset:

Communities are the structure.
Posts are the life of the social network.
Comments and questions create interaction.
Guides solve recurring student problems.
The store helps sustain the project later.

## 13. Registro obligatorio de planes (.md)

En cada tarea se debe mantener un **registro de planes/documentos `.md` pendientes** y su estado de implementación.

Regla operativa:

- Cuando se cree o agregue un nuevo `.md` de plan en cualquier ruta del repositorio, se debe **actualizar este `AGENTS.md`** indicando:
  - ruta del archivo nuevo
  - módulo objetivo
  - estado inicial (pendiente / en progreso / implementado)
  - fecha de alta
- Este registro debe permitir retomar la implementación en tareas futuras sin perder contexto.


## 13. Plan and MD progress registry

Keep this section updated when new execution plans are created in `docs/*.md`.

| Plan / MD | Scope | Status | Notes |
|---|---|---|---|
| `docs/PAGE_QA_MATRIX.md` | QA page-by-page verification before merge | In progress | Matrix created; keep PASS/FAIL execution logs per release. |
| `docs/DEBATES_SPEC.md` | Debates module product definition (general, specialty, extras) | In progress | MVP spec created; next step is backend persistence and UI compose/respond flow. |
| `docs/UI_POLISH_PLAN.md` | Home compact actions, reusable section, notifications entry points | In progress | Added `/app/reutilizable`, `/app/notificaciones`, compact buttons and header icons. |
| `docs/DEBATES_IMPLEMENTATION_PLAN.md` | Debates usable flow: create, list by week, respond, status handling | In progress | Implemented frontend interaction; pending persistence and moderation. |

| `docs/API_ROUTES.md` | Backend API technical route catalog (NestJS controllers + DTOs + auth) | Completed | Added endpoint-by-endpoint PowerShell usage docs. Alta: 2026-05-02. |

| `docs/DEBATES_TRENDS_UI_PLAN.md` | Debates UI por tendencias (diario/semanal/mensual) y filtros académicos/no académicos | In progress | Alta: 2026-05-02. Primera implementación UI aplicada en `apps/web/src/app/app/debates/page.tsx`. |

Status values:
- `Pending`: not started
- `In progress`: partially implemented
- `Completed`: implemented and verified locally
