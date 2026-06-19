"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Upload } from "lucide-react";
import type { Community } from "@crunedu/shared";
import { NOTE_COURSES, NOTE_MATERIAL_TYPES, type NoteVisibility } from "@/components/notes/types";
import { NoteUploadDropzone } from "@/components/notes/NoteUploadDropzone";
import { NoteVisibilitySelector } from "@/components/notes/NoteVisibilitySelector";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { buildLoginHref } from "@/lib/auth-routes";
import { createNote, mapApiError, uploadNoteFile } from "@/lib/api-helpers";

type FormState = {
  title: string;
  description: string;
  course: string;
  cycle: string;
  materialType: string;
  tagsText: string;
  visibility: NoteVisibility;
};

const EMPTY: FormState = { title: "", description: "", course: "", cycle: "", materialType: "", tagsText: "", visibility: "public" };

export default function NewNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCommunityId = searchParams.get("communityId") ? Number(searchParams.get("communityId")) : undefined;
  const { communities } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [communityId, setCommunityId] = useState<number | undefined>(initialCommunityId);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const loginHref = buildLoginHref("/app/apuntes/nuevo");

  useEffect(() => {
    if (initialCommunityId) {
      setForm((prev) => ({ ...prev, visibility: "community" }));
      setCommunityId(initialCommunityId);
    }
  }, [initialCommunityId]);

  useEffect(() => {
    if (toast) {
      const handle = window.setTimeout(() => setToast(null), 3000);
      return () => window.clearTimeout(handle);
    }
  }, [toast]);

  function notify(message: string, type: "success" | "error" | "info" = "info") {
    setToast({ message, type });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isAuthenticated || !accessToken) { setError("Inicia sesión para publicar apuntes."); return; }
    if (!form.title.trim()) { setError("Agrega un título."); return; }
    if (!file) { setError("Selecciona un archivo."); return; }
    if (form.visibility === "community" && !communityId) { setError("Selecciona una comunidad para publicar solo en comunidad."); return; }

    try {
      setSending(true);
      setError(null);
      setUploadError(null);
      const uploaded = await uploadNoteFile(file, accessToken);
      await createNote({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        course: form.course || undefined,
        cycle: form.cycle || undefined,
        materialType: form.materialType || undefined,
        visibility: form.visibility,
        communityId: form.visibility === "community" ? communityId : communityId || undefined,
        tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
        uploadedFile: uploaded,
      }, accessToken);
      notify("Apunte publicado correctamente.", "success");
      window.setTimeout(() => router.push("/app/apuntes"), 800);
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar el apunte."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6">
      {toast ? <div role="alert" className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}

      <Link href="/app/apuntes" className="inline-flex text-sm font-semibold text-indigo-700">← Volver a Apuntes</Link>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6">
        <h1 className="text-2xl font-black text-slate-900">Subir apunte</h1>
        <p className="mt-1 text-sm text-slate-600">Comparte material útil con la comunidad. El curso es opcional.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="note-title" className="mb-1 block text-sm font-semibold text-slate-700">Título</label>
          <input
            id="note-title"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Ej. Resumen de Cálculo I"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="note-description" className="mb-1 block text-sm font-semibold text-slate-700">Descripción (opcional)</label>
          <textarea
            id="note-description"
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Describe qué contiene el apunte..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Archivo</label>
          <NoteUploadDropzone file={file} onFile={(next) => { setFile(next); setUploadError(null); }} error={uploadError} />
        </div>

        <NoteVisibilitySelector
          visibility={form.visibility}
          onVisibility={(value) => setForm({ ...form, visibility: value })}
          communityId={communityId}
          onCommunityId={setCommunityId}
          communities={communities}
        />

        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700"
        >
          <ChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} /> Más opciones
        </button>

        {showMore ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="note-course" className="mb-1 block text-xs font-semibold text-slate-600">Curso (opcional)</label>
                <input
                  id="note-course"
                  list="note-courses-list"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ej. Matemática"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                />
                <datalist id="note-courses-list">{NOTE_COURSES.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label htmlFor="note-cycle" className="mb-1 block text-xs font-semibold text-slate-600">Ciclo (opcional)</label>
                <input
                  id="note-cycle"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ej. 2026-I"
                  value={form.cycle}
                  onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="note-material" className="mb-1 block text-xs font-semibold text-slate-600">Tipo de material</label>
              <select
                id="note-material"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                value={form.materialType}
                onChange={(e) => setForm({ ...form, materialType: e.target.value })}
              >
                <option value="">Selecciona un tipo</option>
                {NOTE_MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="note-tags" className="mb-1 block text-xs font-semibold text-slate-600">Etiquetas (separadas por coma)</label>
              <input
                id="note-tags"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Ej. parcial, resumen"
                value={form.tagsText}
                onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
              />
            </div>
          </div>
        ) : null}

        {!isAuthenticated ? (
          <p className="text-sm text-amber-700">
            Inicia sesión para publicar apuntes.
            <Link href={loginHref} className="ml-2 font-semibold text-indigo-700 underline">Iniciar sesión</Link>
          </p>
        ) : null}

        {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Link href="/app/apuntes" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</Link>
          <button
            type="submit"
            disabled={sending || !isAuthenticated}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {sending ? "Publicando..." : "Publicar apunte"}
          </button>
        </div>
      </form>
    </section>
  );
}
