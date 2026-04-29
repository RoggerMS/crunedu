# Community enhancements (MVP)

## API
- New community detail endpoint: `GET /api/communities/:id`.
- New community feed endpoint with pagination: `GET /api/communities/:id/posts?page=1&pageSize=10`.
- Join community: `POST /api/communities/:id/join` (JWT).
- Leave community: `POST /api/communities/:id/leave` (JWT).
- Recommended communities by simple faculty/career rule: `GET /api/communities/recommended` (JWT).
- Moderator action: hide posts in own community via `POST /api/communities/:id/posts/:postId/hide` (JWT + `community_members.role = MODERATOR`).

## Data model
- Added optional `rules` field on `Community` to keep visible community rules.

## Frontend
- Added community detail page at `/app/comunidades/[id]` with:
  - principal info (name, description, rules)
  - unirse/salir actions
  - recent posts list from paginated endpoint
- Added recommended communities section in `/app/comunidades` for authenticated users.
