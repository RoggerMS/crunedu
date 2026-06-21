"use client";

import { Bell, Home, MessageCircleQuestion, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ITEMS = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/comunidades", label: "Comunidades", icon: Users },
  { href: "/app/preguntas", label: "Preguntas", icon: MessageCircleQuestion },
  { href: "/app/notificaciones", label: "Avisos", icon: Bell },
  { href: "/app/perfil", label: "Perfil", icon: User },
] as const;

function isActive(href: string, pathname: string) {
  if (href === "/app") return pathname === href;
  return pathname.startsWith(href);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href, pathname);
        const Icon = item.icon;
        const showInitials = item.href === "/app/perfil" && initials;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {showInitials ? (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
                  active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
                aria-hidden="true"
              >
                {initials}
              </span>
            ) : (
              <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
            )}
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
