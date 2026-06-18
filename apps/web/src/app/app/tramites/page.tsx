"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TRAMITES, CATEGORY_LABELS, TRAMITE_CATEGORY_ORDER } from "@/components/tramites/tramites-data";

export default function TramitesPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  const categories = useMemo(
    () => [
      { id: "todas", label: "Todas" },
      ...TRAMITE_CATEGORY_ORDER.map((cat) => ({ id: cat, label: CATEGORY_LABELS[cat] })),
    ],
    [],
  );

  const filtered = useMemo(() => {
    let list = TRAMITES;
    if (selectedCategory !== "todas") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query, selectedCategory]);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-indigo-100 bg-white p-5">
        <h1 className="text-2xl font-black text-slate-900">
          Trámites y guías universitarias
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Información de referencia sobre trámites y servicios de la{" "}
          <strong>Universidad Nacional de Educación Enrique Guzmán y Valle</strong>{" "}
          (La Cantuta).
        </p>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Esta sección es una guía informativa de CrunEdu. Verifica siempre la
          información oficial en los canales de la universidad antes de realizar
          cualquier trámite.
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar trámite..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm"
          />
          <Link
            href="/app/universidad"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Ir a Universidad
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              selectedCategory === cat.id
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No encontramos trámites con ese filtro.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tramite) => (
            <Link
              key={tramite.id}
              href={`/app/tramites/${tramite.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <span className="text-3xl">{tramite.icon}</span>
              <h2 className="mt-3 text-base font-bold text-slate-900 group-hover:text-indigo-700">
                {tramite.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                {tramite.description}
              </p>
              <p className="mt-3 text-xs font-semibold text-indigo-600">
                {tramite.area}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
