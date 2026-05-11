"use client";
import { useEffect, useState } from "react";
import type { MomentType } from "./types";

type CreatePayload = { title: string; description?: string; location?: string; type: MomentType; tags: string[]; durationHours: number; media: { id: string; type: "image" | "video"; url: string; alt?: string }[] };

export function CreateMomentModal({ onClose, onCreate, onDraft }: { onClose: ()=>void; onCreate: (payload: CreatePayload)=>void; onDraft: (payload: unknown)=>void }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [location, setLocation] = useState(""); const [type, setType] = useState<MomentType>("now"); const [tags, setTags] = useState(""); const [durationHours, setDurationHours] = useState(24);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function closeModal() {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onClose();
  }

  return <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5"><h2 className="text-xl font-black">Crear momento</h2><input className="mt-3 w-full rounded-xl border p-2" placeholder="¿Qué está pasando?" value={title} onChange={(e)=>setTitle(e.target.value)}/><textarea className="mt-2 w-full rounded-xl border p-2" placeholder="Descripción breve opcional" value={description} onChange={(e)=>setDescription(e.target.value)}/><input className="mt-2 w-full rounded-xl border p-2" placeholder="Ubicación" value={location} onChange={(e)=>setLocation(e.target.value)}/><input className="mt-2 w-full rounded-xl border p-2" placeholder="Hashtags" value={tags} onChange={(e)=>setTags(e.target.value)}/><input className="mt-2 w-full rounded-xl border p-2" type="file" accept="image/*,video/*" onChange={(e)=>{ const file = e.target.files?.[0]; if (!file) return; if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); const objectUrl = URL.createObjectURL(file); setPreviewUrl(objectUrl); setMediaType(file.type.startsWith("video/") ? "video" : "image"); }}/>{previewUrl ? <div className="mt-2 flex items-center justify-between rounded-xl border p-2 text-xs"><span className="truncate pr-2">Archivo listo para publicar</span><button onClick={()=>{ if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="rounded-lg border px-2 py-1">Quitar</button></div> : null}<div className="mt-2 flex gap-2"><button onClick={()=>setDurationHours(24)} className="rounded-xl border px-3 py-1">24 horas</button><button onClick={()=>setDurationHours(168)} className="rounded-xl border px-3 py-1">7 días</button></div><div className="mt-4 flex justify-end gap-2"><button onClick={closeModal} className="rounded-xl border px-3 py-2">Cancelar</button><button onClick={()=>onDraft({title,description,location,type,tags,durationHours})} className="rounded-xl border px-3 py-2">Guardar borrador</button><button onClick={()=>{onCreate({title,description,location,type,tags: tags.split(" ").filter(Boolean).map((t)=>t.replace("#","")),durationHours,media: previewUrl ? [{ id: `${Date.now()}-media`, type: mediaType, url: previewUrl, alt: title || "Momento" }] : []}); closeModal();}} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Publicar momento</button></div></div></div>;
}
