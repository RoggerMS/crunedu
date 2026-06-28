"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { MomentType } from "./types";
import type { UploadedMomentMedia } from "@/lib/moments-api";

export type MomentFormPayload = {
  title: string;
  description?: string;
  location?: string;
  type: MomentType;
  tags: string[];
  durationHours?: number;
  isPermanent?: boolean;
  shareToFeed?: boolean;
  media?: { imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number }[];
};

const TYPE_OPTIONS: { value: MomentType; label: string }[] = [
  { value: "now", label: "Ahora" },
  { value: "campus", label: "Campus" },
  { value: "event", label: "Evento" },
  { value: "alert", label: "Alerta" },
  { value: "food", label: "Comida" },
  { value: "community", label: "Comunidad" },
  { value: "lost_found", label: "Perdido/Encontrado" },
  { value: "humor", label: "Humor" },
];

const DURATION_OPTIONS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hora" },
  { hours: 6, label: "6 horas" },
  { hours: 12, label: "12 horas" },
  { hours: 24, label: "24 horas" },
  { hours: 72, label: "3 días" },
  { hours: 168, label: "7 días" },
];

export function MomentForm({
  submitting,
  onCreate,
  onUpload,
  onDone,
  onCancel,
}: {
  submitting?: boolean;
  onCreate: (payload: MomentFormPayload) => Promise<unknown>;
  onUpload: (file: File) => Promise<UploadedMomentMedia>;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<MomentType>("now");
  const [tags, setTags] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [isPermanent, setIsPermanent] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedMomentMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      setUploaded(await onUpload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
      setPreviewUrl(null);
      setUploaded(null);
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploaded(null);
  }

  async function submit() {
    setError(null);
    if (title.trim().length < 3) { setError("El título debe tener al menos 3 caracteres."); return; }
    if (uploading) { setError("Espera a que termine la subida del archivo."); return; }
    const tagList = tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 8);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        type,
        tags: tagList,
        durationHours: isPermanent ? undefined : durationHours,
        isPermanent,
        shareToFeed,
        media: uploaded ? [uploaded] : undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el momento.");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-slate-600">Título *</label>
        <input className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm" placeholder="¿Qué está pasando?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Descripción</label>
        <textarea className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm" placeholder="Describe el momento (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Ubicación</label>
          <input className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm" placeholder="Ej: Biblioteca" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Tipo</label>
          <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm" value={type} onChange={(e) => setType(e.target.value as MomentType)}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Etiquetas (separadas por comas)</label>
        <input className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-sm" placeholder="Ej: Campus, Aviso" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Duración</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button key={d.hours} type="button" onClick={() => { setDurationHours(d.hours); setIsPermanent(false); }} className={`rounded-xl border px-3 py-1.5 text-sm ${!isPermanent && durationHours === d.hours ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-300"}`}>
              {d.label}
            </button>
          ))}
          <button type="button" onClick={() => setIsPermanent(true)} className={`rounded-xl border px-3 py-1.5 text-sm ${isPermanent ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-300"}`}>
            Siempre
          </button>
        </div>
      </div>
      <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <input type="checkbox" checked={shareToFeed} onChange={(e) => setShareToFeed(e.target.checked)} className="mt-0.5" />
        <span>
          <span className="font-semibold text-slate-700">Compartir también en mi Feed</span>
          <span className="block text-xs text-slate-500">Tus seguidores también podrán ver esta publicación en su Feed.</span>
        </span>
      </label>
      <div>
        <label className="text-xs font-semibold text-slate-600">Imagen o video (opcional)</label>
        <input className="mt-1 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => handleFile(e.target.files?.[0])} />
        {previewUrl ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 text-xs">
            {uploaded?.mimeType.startsWith("video/") ? (
              <video src={previewUrl} controls className="max-h-72 w-full bg-black object-contain" />
            ) : (
              <img src={previewUrl} alt="Vista previa del momento" className="max-h-72 w-full object-cover" />
            )}
            <div className="flex items-center justify-between p-2">
              <span className="truncate pr-2">{uploading ? "Subiendo..." : "Archivo listo para publicar"}</span>
              <button type="button" onClick={removeFile} className="rounded-lg border px-2 py-1">Quitar</button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? <button onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button> : null}
        <button onClick={submit} disabled={submitting || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publicar
        </button>
      </div>
    </div>
  );
}
