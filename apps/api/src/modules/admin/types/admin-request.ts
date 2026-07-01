import { Request } from "express";

export interface AdminRequest extends Request {
  user?: { sub: number; email: string; role: string };
  adminSession?: { id: number; userId: number; expiresAt: Date };
}

export function adminMeta(req: AdminRequest) {
  return {
    adminId: req.user?.sub ?? 0,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) ?? undefined,
    requestId: (req.headers["x-request-id"] as string) ?? undefined,
  };
}
