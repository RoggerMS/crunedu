"use client";

import { useEffect, useState } from "react";
import { NOTE_MATERIAL_TYPES } from "./types";
import type { NoteItem, NoteVisibility } from "./types";
import type { Community } from "@crunedu/shared";
import { NoteVisibilitySelector } from "./NoteVisibilitySelector";
import { updateNote, mapApiError, type NoteApiItem } from "@/lib/api-helpers";

type EditNoteModalProps = {
  open: boolean;
  note: NoteItem | null;
  communities: Community[];
  accessToken: string | null;
  onClose: () => void;
  onUpdated: (note: NoteApiItem) => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
};

type EditForm = {
  title: string;
  description: string;
  course: string;
  cycle: string;
  materialType: string;
  tagsText: string;
  visibility: NoteVisibility;
};

export function EditNoteModal({ open, note, communities, accessToken, onClose, onUpdated, onToast }: EditNoteModalProps) {
  const [form, setForm] = useState<EditForm>({ title: "", description: "", course: "", cycle: "", materialType: "", tagsText: "", visibility: "public" });
  const [communityId, setCommunityId] = useState<number | undefined>(undefined);
  const [showMore, setShowMore] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && note) {
      setForm({
        title: note.title,
        description: note.description ?? "",
        course: note.course ?? "",
        cycle: note.cycle ?? "",
        materialType: note.materialType ?? "",
        tagsText: note.tags.join(", "),
        visibility: note.visibility,
      });
      setCommunityId(note.community?.id ?? undefined);
      setShowMore(true);
    }
  }, [open, note]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !note) return null;

  async function handleSave() {
    if (!note || !accessToken) return;
    if (!form.title.trim()) { onToast("El título es obligatorio.", "info"); return; }
    if (form.visibility === "community" && !communityId) { onToast("Selecciona una comunidad.", "info"); return; }

    try {
      setSaving(true);
      const updated = await updateNote(Number(note.id), {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        course: form.course || undefined,
        cycle: form.cycle || undefined,
        materialType: form.materialType || undefined,
        visibility: form.visibility,
        communityId: form.visibility === "community" ? communityId : undefined,
        tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
      }, accessToken);
      onToast("Apunte actualizado correctamente.", "success");
      onUpdated(updated);
      onClose();
    } catch (err) {
      onToast(mapApiError(err, "No se pudo actualizar el apunte."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Editar apunte">
      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Editar apunte</h3>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50" aria-label="Cerrar">Cancelar</button>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="edit-title" className="mb-1 block text-sm font-semibold text-slate-700">Título</label>
            <input id="edit-title" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label htmlFor="edit-description" className="mb-1 block text-sm font-semibold text-slate-700">Descripción</label>
            <textarea id="edit-description" className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <NoteVisibilitySelector visibility={form.visibility} onVisibility={(value) => setForm({ ...form, visibility: value })} communityId={communityId} onCommunityId={setCommunityId} communities={communities} />

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-course" className="mb-1 block text-xs font-semibold text-slate-600">Curso (opcional)</label>
                <input id="edit-course" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
              </div>
              <div>
                <label htmlFor="edit-cycle" className="mb-1 block text-xs font-semibold text-slate-600">Ciclo (opcional)</label>
                <input id="edit-cycle" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="edit-material" className="mb-1 block text-xs font-semibold text-slate-600">Tipo de material</label>
              <select id="edit-material" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })}>
                <option value="">Selecciona un tipo</option>
                {NOTE_MATERIAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="edit-tags" className="mb-1 block text-xs font-semibold text-slate-600">Etiquetas (separadas por coma)</label>
              <input id="edit-tags" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" disabled={saving} onClick={() => void handleSave()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
