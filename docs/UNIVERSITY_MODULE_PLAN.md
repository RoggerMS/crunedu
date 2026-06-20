# University Module — MVP+ Plan

## Scope
Convert "Universidad" into the information hub for students, with calendar as main element. Includes content management, calendar system, saves, reminders, ICS export, admin panel, and moderation.

## Status: In Progress (Phases 1-3 completed, 4-6 pending)

## Completed phases
- **Phase 1** (Schema + Seed): Extended `UniversityContent` (categoryId, areaId, priority, modality, sourceUrl, officialUrl, deletedAt, contactEmail, capacity, timezone). Added `UniversityContentSaved`, `UniversityAuditLog`. Full seed: 12 categories, 12 areas, 14 calendar items with occurrences, 9 extended content items.
- **Phase 2** (Backend): 25+ endpoints including overview, search, month/day calendar, saves, reminders, reports, admin CRUD, ICS export, audit logs. `CoreModule` integrated for admin auth.
- **Phase 3** (Frontend hub): Real calendar connected to API, URL-synced filters (tipo, area, prioridad), overview-powered sidebar (alerts, upcoming dates, most consulted, areas), categories sidebar, search bar, tabs by type, listing view with filters.

## Status: In Progress (Phases 1-4 completed, 5 partially completed, 6 pending)

## Completed phases
- **Phase 1** (Schema + Seed): Extended `UniversityContent` (categoryId, areaId, priority, modality, sourceUrl, officialUrl, deletedAt, contactEmail, capacity, timezone). Added `UniversityContentSaved`, `UniversityAuditLog`. Full seed: 12 categories, 12 areas, 14 calendar items with occurrences, 9 extended content items.
- **Phase 2** (Backend): 25+ endpoints including overview, search, month/day calendar, saves, reminders, reports, admin CRUD, ICS export, audit logs. `CoreModule` integrated for admin auth.
- **Phase 3** (Frontend hub): Real calendar connected to API, URL-synced filters (tipo, area, prioridad), overview-powered sidebar (alerts, upcoming dates, most consulted, areas), categories sidebar, search bar, tabs by type, listing view with filters.
- **Phase 4** (Calendar full views): Month view with category legend and popover, week view with hours, agenda view grouped by time. Daily agenda page uses real backend data. Calendar item detail modal with save/reminder/ICS/Google Calendar/share. Backend extended with calendar item detail, calendar item save/un-save, calendar item ICS export, improved CalendarQueryDto filters (type, modality, status, onlyFeatured, limit, cursor), fixed range overlap queries.

## Partially completed
- **Phase 5** (Frontend actions): Save/unsave calendar items, reminders with preset options, ICS download, Google Calendar export, share. Pending: report/correction actions on calendar items.

## Pending phases
- **Phase 6**: Admin frontend (backend ready), file attachments, notification integration.

## Files created/modified (Phase 4)
- `apps/api/src/modules/university/dto/calendar-query.dto.ts` — Extended with type, modality, status, onlyFeatured, limit, cursor
- `apps/api/src/modules/university/university.service.ts` — Added getCalendarItemById, toggleCalendarItemSave, removeCalendarItemSave, getSavedCalendarItems, getCalendarItemIcs; fixed range overlap
- `apps/api/src/modules/university/university.controller.ts` — Added GET/POST/DELETE calendar item saves, GET calendar item detail, GET calendar item ICS, GET saved calendar items
- `apps/web/src/lib/api-helpers.ts` — Added CalendarItemDetailApiItem, SavedCalendarItemApiItem, getUniversityCalendarItemById, saveCalendarItem, removeSavedCalendarItem, getSavedCalendarItems, buildCalendarItemIcsUrl
- `apps/web/src/components/university/UniversityCalendarPage.tsx` — Full calendar page with month/week/agenda views, filters, right sidebar, featured agenda
- `apps/web/src/components/university/CalendarMonthView.tsx` — Interactive month grid with day selection, popover, category legend
- `apps/web/src/components/university/CalendarWeekView.tsx` — 7-day week view with hourly slots
- `apps/web/src/components/university/CalendarAgendaView.tsx` — Chronological agenda grouped by time
- `apps/web/src/components/university/CalendarItemDetail.tsx` — Modal/drawer for calendar item detail with save/reminder/ICS/Google Calendar/share
- `apps/web/src/app/app/universidad/calendario/page.tsx` — Uses UniversityCalendarPage component
- `apps/web/src/app/app/universidad/calendario/[date]/page.tsx` — Uses real backend data, save/unsave, detail modal

## Alta: 2026-06-20 (updated 2026-06-20)
