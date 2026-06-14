export const DEFAULT_REQUIRE_AUTH = false;

export function isAppAuthRequired() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true" || DEFAULT_REQUIRE_AUTH;
}

export function buildLoginHref(returnUrl: string, label = "/login") {
  const safeReturnUrl = returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : "/app";
  return `${label}?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
}
