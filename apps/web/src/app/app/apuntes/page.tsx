"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";

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
  const { accessToken, isAuthenticated } = useAccessToken();
  const [items, setItems] = useState<NoteItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [cycle, setCycle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  useEffect(() => { void loadNotes(); }, [courseFilter, cycleFilter]);

  const featuredNotes = useMemo(() => items.slice(0, 3), [items]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSending(true);
      setError(null);
      setSuccessMessage(null);
      await apiRequest("/apuntes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title, description, course, cycle: cycle || undefined, fileUrl }) });
      setSuccessMessage("Apunte publicado correctamente.");
      setTitle(""); setDescription(""); setCourse(""); setCycle(""); setFileUrl("");
      await loadNotes();
    } catch (submitError) {
      setError(mapApiError(submitError, "No se pudo publicar el apunte."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Apuntes" description="Comparte material permitido y encuentra recursos para estudiar." />

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        Los apuntes se gestionan en su propio módulo. Solo aparecerán en el feed general si luego se marcan como destacados.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Publicar apunte</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Título del apunte" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Descripción del apunte" />
        <div className="grid gap-3 md:grid-cols-2">
          <input value={course} onChange={(e) => setCourse(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Curso (ej. Cálculo I)" />
          <input value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Ciclo (ej. 2026-I)" />
        </div>
        <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="URL del archivo" />
        <button disabled={!isAuthenticated || sending} type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Publicando..." : "Publicar apunte"}</button>
        {!isAuthenticated ? <p className="text-sm text-amber-700">Inicia sesión para publicar apuntes.</p> : null}
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <input value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Filtrar por curso" />
        <input value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Filtrar por ciclo" />
      </div>

      {featuredNotes.length > 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="mb-3 text-base font-bold">Destacados</h3><ul className="space-y-2">{featuredNotes.map((note) => <li key={note.id} className="text-sm text-slate-700">{note.title} · {note.course}</li>)}</ul></div> : null}

      {loading ? <p className="text-sm text-slate-600">Cargando apuntes...</p> : null}
      {!loading && items.length === 0 ? <PageState type="empty" title="No hay apuntes aún" description="Publica el primer apunte para tu curso." /> : null}

      {items.length > 0 ? <div className="space-y-3">{items.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold">{note.title}</h3><p className="text-sm text-slate-700">{note.description}</p><p className="mt-2 text-xs text-slate-500">{note.course}{note.cycle ? ` · ${note.cycle}` : ""}</p><a href={note.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo-700">Abrir archivo</a></article>)}</div> : null}
    </section>
  );
}
