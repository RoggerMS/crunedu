# University Module — MVP+ Plan

## Scope
Convert "Universidad" into the information hub for students, with calendar as main element. Includes content management, calendar system, saves, reminders, ICS export, admin panel, and moderation.

## Status: In Progress (Phases 1-3 completed, 4-6 pending)

## Completed phases
- **Phase 1** (Schema + Seed): Extended `UniversityContent` (categoryId, areaId, priority, modality, sourceUrl, officialUrl, deletedAt, contactEmail, capacity, timezone). Added `UniversityContentSaved`, `UniversityAuditLog`. Full seed: 12 categories, 12 areas, 14 calendar items with occurrences, 9 extended content items.
- **Phase 2** (Backend): 25+ endpoints including overview, search, month/day calendar, saves, reminders, reports, admin CRUD, ICS export, audit logs. `CoreModule` integrated for admin auth.
- **Phase 3** (Frontend hub): Real calendar connected to API, URL-synced filters (tipo, area, prioridad), overview-powered sidebar (alerts, upcoming dates, most consulted, areas), categories sidebar, search bar, tabs by type, listing view with filters.

## Pending phases
- **Phase 4**: Calendar full views (month/week/agenda), daily agenda improvement, detail page enrichment per type.
- **Phase 5**: Saves/reminders/ICS on frontend (backend ready), share/report/correction actions.
- **Phase 6**: Admin frontend (backend ready), file attachments, notification integration.

## Files created/modified
- `packages/database/prisma/schema.prisma` — Extended UniversityContent, added UniversityContentSaved, UniversityAuditLog
- `packages/database/prisma/seed.ts` — University categories, areas, calendar items, extended content
- `apps/api/src/modules/university/university.service.ts` — 20+ new methods
- `apps/api/src/modules/university/university.controller.ts` — 25+ endpoints
- `apps/api/src/modules/university/university.module.ts` — CoreModule import
- `apps/api/src/modules/university/dto/calendar-query.dto.ts` — Existing
- `apps/api/src/modules/university/dto/search-query.dto.ts` — New
- `apps/api/src/modules/university/dto/overview-query.dto.ts` — New
- `apps/web/src/lib/api-helpers.ts` — 15+ new API functions + types
- `apps/web/src/app/app/universidad/page.tsx` — Redesigned hub
- `apps/web/src/components/university/CalendarGrid.tsx` — Real events, responsive

## Alta: 2026-06-20
