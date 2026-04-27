# AGENTS.md — CrunEdu

## 1. Project context

CrunEdu is an independent educational social network for university students, initially focused on students from La Cantuta.

CrunEdu is not an official university platform, not an official university website, and not a formal LMS.

The MVP must stay simple, modular, maintainable, and verifiable.

The main product goal is to help students solve real university problems through:

- communities
- posts
- questions and answers
- comments
- useful guides
- allowed notes/documents
- student procedures
- university moments
- a basic store managed by CrunEdu

The platform should first become useful for students from La Cantuta before expanding to other universities.

## 2. Product direction

CrunEdu should work as a student community platform.

The core loop is:

1. A student enters because they have a doubt, need, or university problem.
2. The student finds a community, post, guide, question, or useful information.
3. The student can publish, ask, answer, or comment.
4. Other students interact with the content.
5. Useful information remains organized.
6. The student returns because the platform helped them.

The first functional social goal is:

- users can log in
- users can browse communities
- users can see posts
- users can create posts
- users can comment or answer later

Do not build advanced features before the basic social loop works.

## 3. Tech stack

The current project is a monorepo.

Main stack:

- Operating system used by the project owner: Windows 11
- Local editor: VS Code
- Local container environment: Docker Desktop
- Repository path on the user's machine: `C:\GITHUB\crunedu`

Applications and packages:

- `apps/web`: Next.js + React + TypeScript + Tailwind CSS
- `apps/api`: NestJS + TypeScript
- `packages/database`: Prisma + PostgreSQL
- `packages/shared`: shared TypeScript types and constants
- `packages/ui`: shared UI package if used by the repo

Local Docker Compose services:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- PostgreSQL: `5432`
- Redis: `6379`
- MinIO API: `9000`
- MinIO Console: `9001`
- Mailhog UI: `8025`
- Mailhog SMTP: `1025`

## 4. Current confirmed project state

The following has already been confirmed locally by the user:

- Docker works.
- The API works.
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
- A `.dockerignore` file was created or corrected to prevent Docker from including `node_modules`, `.next`, `dist`, and similar folders.
- The Docker error `invalid file request node_modules/@crunedu/api` was solved by using `.dockerignore`.

Preserve all working functionality.

## 5. Important note about Codex cloud

Codex cloud runs in a separate Linux environment.

Do not assume that `localhost:3000` or `localhost:4000` inside Codex cloud refers to the user's local Windows Docker environment.

The user's local services run on Windows 11 through Docker Desktop.

Therefore:

- If `curl localhost:4000` fails inside Codex cloud, it does not mean the user's local API is broken.
- If `curl localhost:3000` fails inside Codex cloud, it does not mean the user's local frontend is broken.
- Runtime verification with Docker is usually done by the user locally unless the complete stack is explicitly started inside the Codex environment.
- Prefer static checks, code inspection, lint, typecheck, and build commands inside Codex.
- When local runtime verification is needed, provide exact PowerShell commands for the user to run locally.

## 6. Hard rules

Always follow these rules:

1. Never run `docker compose down -v`.
2. Never delete Docker volumes.
3. Never reset, wipe, or drop the database unless the user explicitly approves it.
4. Never run destructive commands without explicit approval.
5. Do not change `schema.prisma` unless strictly necessary for the requested MVP task.
6. Do not implement features outside the requested MVP module.
7. Do not build a full marketplace yet.
8. Do not implement external sellers yet.
9. Do not implement automatic payments yet.
10. Do not implement advanced cart logic yet.
11. Do not implement commissions yet.
12. Do not implement shipping integration yet.
13. Do not implement chat yet.
14. Do not implement notifications yet.
15. Do not implement advanced file uploads yet.
16. Do not add new production dependencies unless necessary.
17. Do not run `npm audit fix --force`.
18. Do not break auth.
19. Do not break communities.
20. Do not break Prisma seed.
21. Do not break Docker setup.
22. Keep code simple, modular, and readable.
23. Technical code must be written in English.
24. Visible UI copy must be written in Spanish.
25. Work in small, verifiable steps.

## 7. Forbidden commands

Never run these commands unless the user explicitly approves and the risk is clearly explained:

```bash
docker compose down -v
docker volume rm
docker system prune -a
rm -rf *
rm -rf node_modules package-lock.json
git reset --hard
git clean -fd
npm audit fix --force
npx prisma migrate reset
npx prisma db push --force-reset
dropdb
truncate
```
