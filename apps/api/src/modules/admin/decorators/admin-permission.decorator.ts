import { SetMetadata } from "@nestjs/common";

export const ADMIN_PERMISSION_KEY = "admin:permission";

export type AdminPermissionName =
  | "dashboard.read"
  | "reports.read"
  | "reports.manage"
  | "users.read"
  | "users.moderate"
  | "feed.manage"
  | "communities.manage"
  | "conversations.manage"
  | "questions.manage"
  | "documents.manage"
  | "university.manage"
  | "moments.manage"
  | "store.manage"
  | "promotions.manage"
  | "placements.manage"
  | "audit.read"
  | "system.read";

export const AdminPermission = (permission: AdminPermissionName) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);
