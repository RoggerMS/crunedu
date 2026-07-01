"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";

type UserIdentityLinkProps = {
  userId: number;
  name: string;
  avatarUrl?: string | null;
  username?: string | null;
  isVerified?: boolean;
  subtitle?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "row" | "avatar-only" | "name-only";
  className?: string;
};

const SIZE_MAP = {
  xs: { avatar: "h-6 w-6 text-[10px]", name: "text-xs", gap: "gap-1.5" },
  sm: { avatar: "h-8 w-8 text-xs", name: "text-sm", gap: "gap-2" },
  md: { avatar: "h-10 w-10 text-sm", name: "text-sm", gap: "gap-2.5" },
  lg: { avatar: "h-12 w-12 text-base", name: "text-base", gap: "gap-3" },
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function UserIdentityLink({
  userId,
  name,
  avatarUrl,
  username,
  isVerified,
  subtitle,
  size = "sm",
  variant = "row",
  className = "",
}: UserIdentityLinkProps) {
  const s = SIZE_MAP[size];
  const href = `/app/perfil/${userId}`;

  const avatar = (
    <div className={`${s.avatar} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-bold text-indigo-700`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );

  if (variant === "avatar-only") {
    return (
      <Link href={href} className={`inline-flex ${className}`} aria-label={name} title={name}>
        {avatar}
      </Link>
    );
  }

  if (variant === "name-only") {
    return (
      <Link href={href} className={`inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600 ${className}`}>
        {name}
        {isVerified ? <BadgeCheck size={14} className="text-indigo-500" /> : null}
      </Link>
    );
  }

  return (
    <Link href={href} className={`group inline-flex items-center ${s.gap} ${className}`}>
      {avatar}
      <div className="min-w-0">
        <div className={`flex items-center gap-1 ${s.name} font-semibold text-slate-800 group-hover:text-indigo-600`}>
          <span className="truncate">{name}</span>
          {isVerified ? <BadgeCheck size={14} className="shrink-0 text-indigo-500" /> : null}
        </div>
        {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </Link>
  );
}

export function getAvatarInitials(name: string): string {
  return getInitials(name);
}
