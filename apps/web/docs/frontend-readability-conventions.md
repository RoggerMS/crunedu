# Frontend readability conventions

## Scope

These conventions apply to pages and modules in `apps/web/src`.

## Component structure

1. Keep route pages (`page.tsx`) focused on composition, access control, and wiring.
2. Move API calls to module-level service files (`services/*Api.ts`).
3. Move stateful behavior to hooks (`hooks/use*.ts`).
4. Keep presentational components stateless when possible (`components/*.tsx`).

## Inline handler rules

1. Avoid long inline handlers in JSX (`onClick`, `onSubmit`, `onChange`) when logic is more than one expression.
2. Use named functions from hooks or component scope.
3. Keep inline handlers only for simple argument forwarding, for example:
   - `onClick={() => onModerate(report.id, "hide")}`

## Module naming

- Hooks: `use<Domain><Intent>` (example: `useAdminReports`, `useModerationActions`).
- Services: `<domain>Api.ts` (example: `adminReportsApi.ts`).
- Components: `<Domain><Role>.tsx` (example: `AdminReportsTable.tsx`).

## Behavioral safety

- Refactors for readability must preserve endpoint URLs, HTTP methods, auth headers, user-visible copy, and loading/error behavior.
- Prefer incremental changes and avoid unrelated redesigns.
