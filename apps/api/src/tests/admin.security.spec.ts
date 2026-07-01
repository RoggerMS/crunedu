import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS admin/security ${name}`);
  } catch (error) {
    console.error(`FAIL admin/security ${name}`);
    throw error;
  }
}

test("admin module is registered", () => {
  const app = read("apps/api/src/app.module.ts");
  assert.match(app, /AdminModule/);
});

test("dashboard requires JWT and admin guard", () => {
  const controller = read("apps/api/src/modules/admin/admin-dashboard.controller.ts");
  assert.match(controller, /JwtAuthGuard/);
  assert.match(controller, /AdminGuard/);
  assert.match(controller, /@AdminOnly\(\)/);
  assert.match(controller, /@AdminPermission\("dashboard\.read"\)/);
});

test("step-up guard validates opaque admin sessions", () => {
  const guard = read("apps/api/src/modules/admin/guards/admin-step-up.guard.ts");
  assert.match(guard, /x-admin-session/);
  assert.match(guard, /createHash\("sha256"\)/);
  assert.doesNotMatch(guard, /password/i);
});

test("admin session stores hashes and expires", () => {
  const schema = read("packages/database/prisma/schema.prisma");
  assert.match(schema, /model AdminSession/);
  assert.match(schema, /tokenHash\s+String\s+@unique/);
  assert.match(schema, /expiresAt\s+DateTime/);
  const adminSession = schema.slice(schema.indexOf("model AdminSession"), schema.indexOf("model AdminAuditLog"));
  assert.doesNotMatch(adminSession, /adminCode|pin|password|jwt/i);
});

test("audit model exists and avoids secret-shaped fields", () => {
  const schema = read("packages/database/prisma/schema.prisma");
  assert.match(schema, /model AdminAuditLog/);
  const audit = schema.slice(schema.indexOf("model AdminAuditLog"), schema.indexOf("model Promotion"));
  assert.doesNotMatch(audit, /password|token|cookie|authorization/i);
});

test("production bypass validation is present", () => {
  const main = read("apps/api/src/main.ts");
  assert.match(main, /NODE_ENV/);
  assert.match(main, /DEV_BYPASS_ADMIN_GATES/);
  assert.match(main, /DEV_RELAXED_AUTH/);
  assert.match(main, /cannot be enabled in production/);
});

test("frontend main navigation does not expose admin links", () => {
  const shared = read("packages/shared/src/index.ts");
  assert.doesNotMatch(shared, /Admin tienda|Admin reportes/);
  const nav = shared.slice(shared.indexOf("MAIN_NAVIGATION"), shared.indexOf("] as const", shared.indexOf("MAIN_NAVIGATION")));
  assert.doesNotMatch(nav, /\/app\/admin/);
});

test("frontend auth user carries role from users me", () => {
  const provider = read("apps/web/src/providers/auth-provider.tsx");
  const users = read("apps/api/src/modules/users/users.service.ts");
  assert.match(provider, /role: "USER" \| "MODERATOR" \| "ADMIN"/);
  assert.match(users, /role: true/);
});

test("admin layout uses auth provider and sessionStorage only for opaque admin session", () => {
  const layout = read("apps/web/src/app/app/admin/layout.tsx");
  assert.match(layout, /useAuth/);
  assert.match(layout, /user\?\.role === "ADMIN"/);
  assert.match(layout, /sessionStorage\.setItem\("crunedu_admin_session"/);
  assert.doesNotMatch(layout, /localStorage\.setItem\("crunedu_admin_session"/);
});

test("documentation files exist", () => {
  assert.ok(existsSync(join(root, "docs/ADMIN_IMPLEMENTATION_STATUS.md")));
  assert.ok(existsSync(join(root, "docs/ADMIN_RUNBOOK.md")));
  assert.ok(existsSync(join(root, "docs/ADMIN_SECURITY_CHECKLIST.md")));
});
