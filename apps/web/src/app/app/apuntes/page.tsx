"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState, PrimaryButton } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/http-client";

type NoteItem = {
  id: number;
  title: string;
  description: string | null;
  course: string;
  cycle: string | null;
  fileUrl: string;
  createdAt: string;
  author: { firstName: string | null; lastName: string | null; email: string };
};

export default function NotesPage() {
  const [items, setItems] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState("");
  const [cycleFilter, setCycleFilter] = useState("");

  async function loadNotes() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (courseFilter.trim()) params.set("course", courseFilter.trim());
      if (cycleFilter.trim()) params.set("cycle", cycleFilter.trim());
      const data = await apiRequest<NoteItem[]>(`/apuntes?${params.toString()}`);
      setItems(data);
    } catch (loadError) {
      setError(mapApiError(loadError, "No se pudieron cargar los apuntes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, [courseFilter, cycleFilter]);

  const featuredNotes = useMemo(() => items.slice(0, 3), [items]);

  return (
    <section className="space-y-6">
      <ModuleHeader title="Apuntes" description="Comparte material permitido y encuentra recursos para estudiar." />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Publica tus apuntes en un formulario dedicado para mantener este módulo ordenado.</p>
          <Link href="/app/apuntes/nuevo">
            <PrimaryButton type="button">Publicar apunte</PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <input value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Filtrar por curso" />
        <input value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Filtrar por ciclo" />
      </div>

      {featuredNotes.length > 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="mb-3 text-base font-bold">Destacados</h3><ul className="space-y-2">{featuredNotes.map((note) => <li key={note.id} className="text-sm text-slate-700">{note.title} · {note.course}</li>)}</ul></div> : null}

      {loading ? <p className="text-sm text-slate-600">Cargando apuntes...</p> : null}
      {!loading && items.length === 0 ? <PageState type="empty" title="No hay apuntes aún" description="Publica el primer apunte para tu curso." /> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {items.length > 0 ? <div className="space-y-3">{items.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold">{note.title}</h3><p className="text-sm text-slate-700">{note.description}</p><p className="mt-2 text-xs text-slate-500">{note.course}{note.cycle ? ` · ${note.cycle}` : ""}</p><a href={note.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo-700">Abrir archivo</a></article>)}</div> : null}
    </section>
  );
}
