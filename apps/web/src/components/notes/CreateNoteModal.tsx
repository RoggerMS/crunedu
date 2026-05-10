"use client";
import { useEffect, useState } from "react";
import type { NoteDraftInput, NoteFileType } from "./types";
import { NOTE_COURSES } from "./note-data";

const allowedFiles = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "application/zip"];

export function CreateNoteModal({ open, onClose, onPublish, onSaveDraft }: { open: boolean; onClose: () => void; onPublish: (payload: NoteDraftInput) => void; onSaveDraft: (payload: NoteDraftInput) => void }) {
  const [form, setForm] = useState<NoteDraftInput>({ title: "", description: "", course: "", materialType: "Resumen", tags: [], visibility: "publico" });
  useEffect(() => { const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose(); if (open) window.addEventListener("keydown", onEsc); return () => window.removeEventListener("keydown", onEsc); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/40 p-2 sm:p-4"><div className="mx-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4"><h3 className="text-lg font-bold">Subir apunte</h3>
    <input className="mt-2 w-full rounded-xl border p-2" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <select className="mt-2 w-full rounded-xl border p-2" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}><option value="">Selecciona curso</option>{NOTE_COURSES.map((c) => <option key={c}>{c}</option>)}</select>
    <input className="mt-2 w-full rounded-xl border p-2" placeholder="Tipo de material" value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} />
    <textarea className="mt-2 w-full rounded-xl border p-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <input type="text" className="mt-2 w-full rounded-xl border p-2" placeholder="Etiquetas separadas por coma" onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
    <input type="file" className="mt-2 w-full" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 25 * 1024 * 1024) return; if (!allowedFiles.includes(f.type)) return; const fileType: NoteFileType = f.type.includes("pdf") ? "pdf" : f.type.includes("word") ? "word" : f.type.includes("presentation") ? "ppt" : f.type.includes("image") ? "image" : "zip"; setForm({ ...form, file: { name: f.name, size: f.size, type: f.type, fileType } }); }} />
    <input type="file" accept="image/*" multiple className="mt-2 w-full" onChange={(e) => { const images = [...(e.target.files ?? [])].filter((file) => file.size <= 5 * 1024 * 1024).map((file) => ({ url: URL.createObjectURL(file), alt: file.name })); setForm({ ...form, images }); }} />
    <select className="mt-2 w-full rounded-xl border p-2" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as NoteDraftInput["visibility"] })}><option value="publico">Público</option><option value="comunidad">Solo comunidad</option><option value="privado">Privado</option></select>
    <input className="mt-2 w-full rounded-xl border p-2" placeholder="Comunidad opcional" onChange={(e) => setForm({ ...form, communityId: e.target.value })} />
    <div className="mt-3 rounded-xl border bg-slate-50 p-2 text-xs">Vista previa: {form.title || "Sin título"} · {form.course || "Sin curso"}</div>
    <div className="mt-3 flex flex-wrap justify-end gap-2"><button className="rounded-xl border px-3 py-1" onClick={onClose}>Cancelar</button><button className="rounded-xl border px-3 py-1" onClick={() => onSaveDraft(form)}>Guardar borrador</button><button className="rounded-xl bg-indigo-600 px-3 py-1 text-white" onClick={() => onPublish(form)}>Publicar apunte</button></div></div></div>;
}
