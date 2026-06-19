"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Community } from "@crunedu/shared";
import type { NoteDraftInput, NoteVisibility } from "./types";
import { NOTE_COURSES, NOTE_MATERIAL_TYPES } from "./types";
import { NoteUploadDropzone } from "./NoteUploadDropzone";
import { NoteVisibilitySelector } from "./NoteVisibilitySelector";
import { createNote, mapApiError, uploadNoteFile } from "@/lib/api-helpers";
import { useAccessToken } from "@/hooks/useAccessToken";

type CreateNoteModalProps = {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
  communities: Community[];
  initialCommunityId?: number;
};

const EMPTY: NoteDraftInput = { title: "", description: "", course: "", cycle: "", materialType: "", tags: [], visibility: "public" };

export function CreateNoteModal({ open, onClose, onPublished, onToast, communities, initialCommunityId }: CreateNoteModalProps) {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [form, setForm] = useState<NoteDraftInput>(EMPTY);
  const [communityId, setCommunityId] = useState<number | undefined>(initialCommunityId);
  const [file, setFile] = useState<File | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, visibility: initialCommunityId ? "community" : "public" });
      setCommunityId(initialCommunityId);
      setFile(null);
      setTagsText("");
      setShowMore(false);
      setUploadError(null);
    }
  }, [open, initialCommunityId]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  async function handlePublish() {
    if (!isAuthenticated || !accessToken) { onToast("Inicia sesión para publicar apuntes.", "info"); return; }
    if (!form.title.trim()) { onToast("Agrega un título.", "info"); return; }
    if (!file) { onToast("Selecciona un archivo.", "info"); return; }
    if (form.visibility === "community" && !communityId) { onToast("Selecciona una comunidad para publicar solo en comunidad.", "info"); return; }

    try {
      setSending(true);
      setUploadError(null);
      const uploaded = await uploadNoteFile(file);
      await createNote({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        course: form.course || undefined,
        cycle: form.cycle || undefined,
        materialType: form.materialType || undefined,
        visibility: form.visibility,
        communityId: form.visibility === "community" ? communityId : communityId || undefined,
        tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
        uploadedFile: uploaded,
      }, accessToken);
      onToast("Apunte publicado correctamente.", "success");
      onPublished();
      onClose();
    } catch (err) {
      onToast(mapApiError(err, "No se pudo publicar el apunte."), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center sm:p-4">
      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Subir apunte</h3>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">Cancelar</button>
        </div>

        <div className="mt-3 space-y-3">
          <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Título del apunte" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Descripción del apunte (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <NoteUploadDropzone file={file} onFile={(next) => { setFile(next); setUploadError(null); }} error={uploadError} />
          <NoteVisibilitySelector visibility={form.visibility} onVisibility={(value) => setForm({ ...form, visibility: value })} communityId={communityId} onCommunityId={setCommunityId} communities={communities} />

          <button type="button" onClick={() => setShowMore((prev) => !prev)} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
            <ChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} /> Más opciones
          </button>

          {showMore ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Curso (opcional)</label>
                  <input list="note-courses" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Ej. Matemática" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                  <datalist id="note-courses">{NOTE_COURSES.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Ciclo (opcional)</label>
                  <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Ej. 2026-I" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de material</label>
                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })}>
                  <option value="">Selecciona un tipo</option>
                  {NOTE_MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Etiquetas (separadas por coma)</label>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Ej. parcial, resumen" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
              </div>
            </div>
          ) : null}

          {!isAuthenticated ? <p className="text-sm text-amber-700">Inicia sesión para publicar apuntes.</p> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" disabled={sending} onClick={() => void handlePublish()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {sending ? "Publicando..." : "Publicar apunte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
