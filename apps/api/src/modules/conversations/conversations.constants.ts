import { ConversationMaterialType } from "@prisma/client";

export const CONVERSATION_STORAGE_FOLDER = "conversations";
export const CONVERSATION_MEDIA_PUBLIC_PATH = "/api/conversations/media";

export const CONVERSATION_MATERIAL_RULES = [
  { extensions: ["pdf"], mimeTypes: ["application/pdf"], maxBytes: 15 * 1024 * 1024, category: ConversationMaterialType.PDF },
  {
    extensions: ["docx"],
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxBytes: 15 * 1024 * 1024,
    category: ConversationMaterialType.DOCX,
  },
  {
    extensions: ["pptx"],
    mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    maxBytes: 15 * 1024 * 1024,
    category: ConversationMaterialType.PPTX,
  },
  {
    extensions: ["jpg", "jpeg", "png", "webp"],
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 15 * 1024 * 1024,
    category: ConversationMaterialType.IMAGE,
  },
] as const;

export const CONVERSATION_MAX_MATERIALS = 10;

export const SHARED_LINK_ALLOWED_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "discord.com",
  "discord.gg",
  "drive.google.com",
  "docs.google.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "es.wikipedia.org",
  "wikipedia.org",
];

export const SHARED_LINK_BLOCKED_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];

export function findMaterialRule(originalName: string, mimeType: string) {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  const mt = mimeType.toLowerCase();
  for (const rule of CONVERSATION_MATERIAL_RULES) {
    if ((rule.extensions as readonly string[]).includes(ext) || (rule.mimeTypes as readonly string[]).includes(mt)) return rule;
  }
  return null;
}

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (SHARED_LINK_BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
}

export async function hashToken(token: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}
