"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState, PrimaryButton } from "@/components/ui";
import { apiRequest } from "@/lib/api-helpers";

type Community = { id: number; name: string };
type PostItem = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  commentsCount: number;
  author: { id: number; firstName: string | null; lastName: string | null; email: string };
  community: Community | null;
};

export default function ProceduresPage() {
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<{ items: PostItem[] }>("/posts?limit=30");
        const tramitesPosts = (data.items ?? []).filter((post) => post.community?.name?.toLowerCase() === "trámites");
        setItems(tramitesPosts);
      } catch {
        setError("No se pudieron cargar los trámites por ahora.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const recentAlerts = useMemo(() => items.slice(0, 3), [items]);

  return (
    <section className="space-y-6">
      <ModuleHeader title="Trámites" description="Guías y actualizaciones publicadas por el equipo de CrunEdu para La Cantuta." />

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="w-full text-sm font-semibold text-slate-800">¿Eres administrador?</p>
        <PrimaryButton asChild>
          <Link href="/app/admin/tramites/nuevo">Publicar nuevo trámite</Link>
        </PrimaryButton>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-amber-700">Alertas recientes por trámite</h2>
        {recentAlerts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-700">Aún no hay alertas recientes.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentAlerts.map((alert) => (
              <li key={alert.id}>
                <Link href={`/app/tramites/${alert.id}`} className="block rounded-xl border border-amber-100 bg-white p-3 text-sm text-slate-700 hover:border-amber-300">
                  <p className="font-semibold text-slate-900">{alert.title || "Trámite sin título"}</p>
                  <p className="line-clamp-2">{alert.content}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString("es-PE")}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading ? <PageState type="loading" title="Cargando trámites" description="Estamos trayendo publicaciones reales desde el backend." /> : null}
      {error ? <PageState type="error" title="Error al cargar trámites" description={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          <h2 className="text-lg font-black">Trámites publicados</h2>
          {items.length === 0 ? (
            <PageState type="empty" title="No hay trámites publicados aún" description="Publica el primer trámite desde el panel de admin para que los estudiantes puedan comentar." />
          ) : (
            items.map((post) => (
              <Link key={post.id} href={`/app/tramites/${post.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
                <p className="text-lg font-bold text-slate-900">{post.title || "Trámite sin título"}</p>
                <p className="mt-1 text-sm text-slate-700 line-clamp-3">{post.content}</p>
                <p className="mt-2 text-xs text-slate-500">{post.commentsCount} comentarios</p>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
