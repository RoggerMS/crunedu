"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { notificationHref } from "@/features/notifications/notification.types";
import { useNotifications } from "@/hooks/useNotifications";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return new Date(value).toLocaleDateString("es-PE");
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = useNotifications();

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden shrink-0 lg:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
        aria-label="Abrir notificaciones"
        aria-expanded={open}
      >
        <Bell size={18} />
        {notifications.unreadCount > 0 ? <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}</span> : null}
      </button>
      {open ? (
        <section className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div><h2 className="font-black text-slate-950">Notificaciones</h2><p className="text-xs text-slate-500">{notifications.unreadCount} sin leer</p></div>
            {notifications.unreadCount ? <button type="button" onClick={() => void notifications.markAllRead()} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><CheckCheck size={14} /> Marcar todas</button> : null}
          </header>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.loading && !notifications.items.length ? <p className="p-5 text-sm text-slate-500">Cargando...</p> : null}
            {notifications.error ? <p className="p-5 text-sm text-rose-700">{notifications.error}</p> : null}
            {!notifications.loading && !notifications.error && !notifications.items.length ? <p className="p-5 text-sm text-slate-500">Aún no tienes notificaciones.</p> : null}
            {notifications.items.slice(0, 8).map((item) => (
              <Link key={item.id} href={notificationHref(item)} onClick={() => { void notifications.markRead(item.id); setOpen(false); }} className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${item.isRead ? "bg-white" : "bg-indigo-50/70"}`}>
                <div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-slate-200" : "bg-indigo-600"}`} /><div className="min-w-0"><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-sm text-slate-600">{item.message}</p><p className="mt-1 text-[11px] text-slate-400">{relativeTime(item.createdAt)}</p></div></div>
              </Link>
            ))}
          </div>
          <Link href="/app/notificaciones" onClick={() => setOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-indigo-700 hover:bg-slate-50">Ver todas las notificaciones</Link>
        </section>
      ) : null}
    </div>
  );
}
