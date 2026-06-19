"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUniversityContentById } from "@/lib/api-helpers";
import type { UniversityContentApiItem } from "@/lib/api-helpers";
import { Bookmark, CalendarPlus, Download, Share2 } from "lucide-react";

const icons: Record<string, string> = { TRAMITE: "📝", CONVOCATORIA: "📣", EVENTO: "🎉", SERVICIO: "🧩", GUIA: "📘", AVISO: "📌" };
const statusLabels: Record<string, string> = { urgente: "Urgente", oficial: "Oficial", nuevo: "Nuevo", abierto: "Abierto", actualizado: "Actualizado", proximo_cierre: "Próximo cierre" };

export default function UniversidadDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<UniversityContentApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUniversityContentById(params.id);
        if (!cancelled) setItem(data);
      } catch {
        if (!cancelled) setError("No encontramos esta información.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  const pulseToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <Link href="/app/universidad" className="text-sm text-indigo-600">← Volver a Universidad</Link>
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="space-y-3">
        <Link href="/app/universidad" className="text-sm text-indigo-600">← Volver a Universidad</Link>
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-sm text-slate-600">{error ?? "No encontramos esta información."}</p>
        </div>
      </section>
    );
  }

  const typeLower = (item.type ?? "").toLowerCase();
  const typeLabel =
    typeLower === "tramite" ? "Trámite" :
    typeLower === "convocatoria" ? "Convocatoria" :
    typeLower === "evento" ? "Evento" :
    typeLower === "servicio" ? "Servicio" :
    typeLower === "guia" ? "Guía" : "Aviso";
  const statusTags: string[] = Array.isArray(item.statusTags) ? item.statusTags : [];

  return (
    <section className="space-y-5">
      <Link href="/app/universidad" className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800">
        ← Volver a Universidad
      </Link>

      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5">
        <span className="text-4xl">{icons[item.type] ?? "📌"}</span>
        <h1 className="mt-3 text-2xl font-black text-slate-900">{item.title}</h1>
        <p className="text-sm text-slate-500">
          {typeLabel} · {item.category} · {item.area}
        </p>
        <p className="mt-2 text-sm text-slate-700">{item.description}</p>
        {statusTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {statusTags.map((s: string) =>
              statusLabels[s] ? <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{statusLabels[s]}</span> : null
            )}
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {item.steps && (item.steps as string[]).length > 0 && (
            <article className="rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">Pasos a seguir</h2>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-700">
                {(item.steps as string[]).map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </article>
          )}

          {item.documents && (item.documents as string[]).length > 0 && (
            <article className="rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">Documentos necesarios</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                {(item.documents as string[]).map((doc: string, index: number) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </article>
          )}

          {item.warning && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">⚠️ Aviso importante</p>
              <p className="mt-1">{item.warning}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Detalles</h3>
            <dl className="mt-2 space-y-2">
              {item.area && (
                <div>
                  <dt className="text-xs text-slate-500">Área</dt>
                  <dd className="text-slate-700">{item.area}</dd>
                </div>
              )}
              {item.schedule && (
                <div>
                  <dt className="text-xs text-slate-500">Horario</dt>
                  <dd className="text-slate-700">{item.schedule}</dd>
                </div>
              )}
              {item.location && (
                <div>
                  <dt className="text-xs text-slate-500">Ubicación</dt>
                  <dd className="text-slate-700">{item.location}</dd>
                </div>
              )}
              {item.cost && (
                <div>
                  <dt className="text-xs text-slate-500">Costo</dt>
                  <dd className="text-slate-700">{item.cost}</dd>
                </div>
              )}
              {item.time && (
                <div>
                  <dt className="text-xs text-slate-500">Hora</dt>
                  <dd className="text-slate-700">{item.time}</dd>
                </div>
              )}
              {item.startDate && (
                <div>
                  <dt className="text-xs text-slate-500">Inicio</dt>
                  <dd className="text-slate-700">{item.startDate.slice(0, 10)}</dd>
                </div>
              )}
              {item.deadline && (
                <div>
                  <dt className="text-xs text-slate-500">Cierre</dt>
                  <dd className="text-slate-700">{item.deadline.slice(0, 10)}</dd>
                </div>
              )}
            </dl>
          </article>

          {item.fileUrl && (
            <article className="rounded-2xl border bg-white p-4 text-sm">
              <h3 className="font-semibold text-slate-900">Archivo adjunto</h3>
              <a
                href={item.fileUrl}
                className="mt-2 inline-flex items-center gap-1 text-indigo-600 hover:underline"
                onClick={() => pulseToast("Descarga iniciada.")}
              >
                <Download className="h-4 w-4" />
                {item.fileName ?? "Descargar archivo"}
              </a>
            </article>
          )}

          <div className="flex gap-2">
            <button onClick={() => pulseToast("Función disponible próximamente.")} className="flex-1 rounded-xl border px-3 py-2 text-sm">
              <Bookmark className="mr-1 inline h-4 w-4" />Guardar
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/app/universidad/${item.id}`);
                pulseToast("Enlace copiado.");
              }}
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            >
              <Share2 className="mr-1 inline h-4 w-4" />Compartir
            </button>
          </div>

          <Link
            href="/app/universidad"
            className="block rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 text-center"
          >
            Ir a Universidad →
          </Link>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-slate-900 px-3 py-2 text-sm text-white">
          {toast}
        </div>
      )}
    </section>
  );
}
