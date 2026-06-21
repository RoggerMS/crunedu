"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { LoginRequiredNotice } from "@/components/auth/login-required-notice";
import { Card } from "@/components/ui";
import { notificationHref } from "@/features/notifications/notification.types";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificacionesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const notifications = useNotifications();
  if (isLoading) return <Card>Cargando notificaciones...</Card>;
  if (!isAuthenticated) return <LoginRequiredNotice title="Inicia sesión para ver tus notificaciones." description="Aquí aparecerá la actividad relacionada con tu cuenta." returnUrl="/app/notificaciones" />;

  return <section className="mx-auto max-w-3xl space-y-4">
    <Card className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-black">Notificaciones</h1><p className="text-sm text-slate-600">Actividad de tus publicaciones y tu perfil.</p></div>{notifications.unreadCount ? <button onClick={() => void notifications.markAllRead()} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700"><CheckCheck size={16} /> Marcar todas</button> : null}</Card>
    {notifications.loading && !notifications.items.length ? <Card>Cargando...</Card> : null}
    {notifications.error ? <Card className="text-rose-700">{notifications.error}</Card> : null}
    {!notifications.loading && !notifications.error && !notifications.items.length ? <Card className="py-10 text-center"><Bell className="mx-auto text-slate-300" size={36} /><h2 className="mt-3 font-bold">Aún no tienes notificaciones</h2><p className="mt-1 text-sm text-slate-500">Cuando alguien interactúe contigo, aparecerá aquí.</p></Card> : null}
    <div className="space-y-2">{notifications.items.map((item) => <Link key={item.id} href={notificationHref(item)} onClick={() => void notifications.markRead(item.id)} className={`block rounded-2xl border p-4 transition hover:border-indigo-200 hover:shadow-sm ${item.isRead ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50"}`}><div className="flex gap-3"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? "bg-slate-200" : "bg-indigo-600"}`} /><div><h2 className="font-bold text-slate-900">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("es-PE")}</p></div></div></Link>)}</div>
  </section>;
}
