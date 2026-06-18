"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { TRAMITES, CATEGORY_LABELS } from "@/components/tramites/tramites-data";

export default function TramiteDetailPage() {
  const params = useParams<{ id: string }>();
  const tramite = TRAMITES.find((t) => t.id === params.id);

  if (!tramite) {
    notFound();
  }

  const related = TRAMITES.filter(
    (t) => t.id !== tramite.id && t.category === tramite.category,
  );

  return (
    <section className="space-y-5">
      <Link
        href="/app/tramites"
        className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        ← Volver a Trámites
      </Link>

      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5">
        <span className="text-4xl">{tramite.icon}</span>
        <h1 className="mt-3 text-2xl font-black text-slate-900">
          {tramite.title}
        </h1>
        <p className="text-sm text-slate-500">
          {CATEGORY_LABELS[tramite.category]} · {tramite.area}
        </p>
        <p className="mt-2 text-sm text-slate-700">{tramite.description}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <article className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Pasos a seguir
            </h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-700">
              {tramite.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Documentos necesarios
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              {tramite.documents.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </article>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">⚠️ Aviso importante</p>
            <p className="mt-1">{tramite.warning}</p>
          </div>
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Información de contacto</h3>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-xs text-slate-500">Área</dt>
                <dd className="text-slate-700">{tramite.area}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Horario</dt>
                <dd className="text-slate-700">{tramite.schedule}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Ubicación</dt>
                <dd className="text-slate-700">{tramite.location}</dd>
              </div>
            </dl>
          </article>

          {related.length > 0 && (
            <article className="rounded-2xl border bg-white p-4 text-sm">
              <h3 className="font-semibold text-slate-900">
                Relacionados
              </h3>
              <ul className="mt-2 space-y-1">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/app/tramites/${item.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          )}

          <Link
            href="/app/universidad"
            className="block rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Ir a Universidad →
          </Link>
        </aside>
      </div>
    </section>
  );
}
