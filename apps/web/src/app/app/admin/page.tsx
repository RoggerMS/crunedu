"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Flag, HeartPulse, Shield, Users } from "lucide-react";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/http-client";

type AdminDashboard = {
  overview: {
    users: { total: number; today: number; last7d: number; last30d: number };
    posts: number; comments: number; questions: number; answers: number; documents: number;
    communities: number; moments: number; conversations: number; products: number; reportsOpen: number;
  };
  reports: { total: number; critical: number; high: number; medium: number; low: number; overdue: number; byModule: Record<string, number> };
  activity: { newUsers: Array<{ id: number; email: string; name: string; createdAt: string }>; posts: Array<{ id: number; title: string; author: string; createdAt: string }>; reports: Array<{ id: number; reason: string; status: string; createdAt: string }>; adminActions: Array<{ id: number; action: string; module: string; admin: string; createdAt: string }> };
};

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>;
}

export default function AdminPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!accessToken) return;
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest<AdminDashboard>("/admin/dashboard", { headers: { Authorization: `Bearer ${accessToken}` } });
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el panel.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [accessToken]);

  if (loading) return <p className="text-sm text-slate-600">Cargando métricas reales...</p>;
  if (error) return <Card><p className="text-sm text-rose-600">{error}</p></Card>;
  if (!data) return <Card><p className="text-sm text-slate-600">No hay datos administrativos disponibles.</p></Card>;

  const metrics = [
    ["Usuarios", data.overview.users.total], ["Nuevos hoy", data.overview.users.today], ["Usuarios 7 días", data.overview.users.last7d], ["Publicaciones", data.overview.posts],
    ["Comentarios", data.overview.comments], ["Preguntas", data.overview.questions], ["Respuestas", data.overview.answers], ["Apuntes", data.overview.documents],
    ["Comunidades", data.overview.communities], ["Momentos", data.overview.moments], ["Conversaciones", data.overview.conversations], ["Productos", data.overview.products], ["Reportes abiertos", data.overview.reportsOpen],
  ] as const;

  return (
    <section className="space-y-5">
      <Card className="space-y-2">
        <h1 className="text-2xl font-black">Panel de administración</h1>
        <p className="text-sm text-slate-600">Resumen real conectado a la API administrativa, PostgreSQL y auditoría.</p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3"><h2 className="flex items-center gap-2 text-base font-bold"><Flag size={18} />Reportes prioritarios</h2><p className="text-sm text-slate-600">Altos: {data.reports.high} · Medios: {data.reports.medium} · Bajos: {data.reports.low} · Vencidos SLA: {data.reports.overdue}</p><PrimaryButton asChild><Link href="/app/admin/reportes">Revisar reportes</Link></PrimaryButton></Card>
        <Card className="space-y-3"><h2 className="flex items-center gap-2 text-base font-bold"><Activity size={18} />Actividad reciente</h2><ul className="space-y-1 text-sm text-slate-600">{data.activity.posts.slice(0, 3).map((p) => <li key={p.id}>Publicación: {p.title || "Sin título"}</li>)}{data.activity.posts.length === 0 ? <li>No hay publicaciones recientes.</li> : null}</ul></Card>
        <Card className="space-y-3"><h2 className="flex items-center gap-2 text-base font-bold"><HeartPulse size={18} />Salud del sistema</h2><p className="text-sm text-slate-600">Consulta API, PostgreSQL, Redis, MinIO y módulos sin exponer secretos.</p><SecondaryButton asChild><Link href="/app/admin/sistema">Ver sistema</Link></SecondaryButton></Card>
      </div>
      <Card className="space-y-3"><h2 className="flex items-center gap-2 text-base font-bold"><Shield size={18} />Accesos rápidos</h2><div className="flex flex-wrap gap-2"><PrimaryButton asChild><Link href="/app/admin/usuarios"><Users size={16} />Usuarios</Link></PrimaryButton><SecondaryButton asChild><Link href="/app/admin/feed">Administrar feed</Link></SecondaryButton><SecondaryButton asChild><Link href="/app/admin/anuncios">Crear promoción</Link></SecondaryButton><SecondaryButton asChild><Link href="/app/admin/ubicaciones">Destacados</Link></SecondaryButton></div></Card>
    </section>
  );
}
