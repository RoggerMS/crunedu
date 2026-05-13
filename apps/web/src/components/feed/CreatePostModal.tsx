import { AlignLeft, FileUp, MessageCircle, MessageSquarePlus, NotebookPen, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import { MAX_FEED_IMAGES } from "./constants";
import type { CommunityLite, CreatePostSubmitPayload, LocalAttachmentFile, PostType } from "./types";

const suggestedTags = ["recurso", "consejo", "comunidad", "universidad"];
const blockedMessages: Record<Exclude<PostType, "publicacion">, string> = {
  apunte: "Los apuntes se crearán desde el módulo Apuntes. Luego podrás compartirlos en el feed.",
  pregunta: "Las preguntas se crearán desde Preguntas. Luego podrás compartirlas en el feed.",
  momento: "Los momentos se crearán desde Momentos. Luego podrás compartirlos en el feed.",
  debate: "Los debates se crearán desde Debates. Luego podrás compartirlos en el feed.",
  tramite: "Los trámites se crearán desde Universidad. Luego podrás compartirlos en el feed.",
};

export function CreatePostModal(props: { open: boolean; initialType: PostType; communities: CommunityLite[]; isAuthenticated: boolean; onClose: () => void; onSaveDraft: (data: CreatePostSubmitPayload) => void; onSubmit: (data: CreatePostSubmitPayload) => void; onToast: (message: string, type: "success" | "error" | "info") => void }) {
  const [type, setType] = useState<PostType>(props.initialType); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [communityId, setCommunityId] = useState(""); const [visibility, setVisibility] = useState<"todos" | "comunidad">("todos");
  const [tags, setTags] = useState<string[]>([]); const [tagInput, setTagInput] = useState(""); const [images, setImages] = useState<Array<{ id: string; mediaId: string; previewUrl?: string }>>([]);
  useEffect(() => setType(props.initialType), [props.initialType, props.open]);
  const hasContent = Boolean(content.trim().length >= 1 || images.length > 0);
  const canSubmit = props.isAuthenticated && type === "publicacion" && hasContent;
  const addTag = (raw: string) => { const clean = raw.trim().toLowerCase(); if (!clean || tags.includes(clean)) return; setTags((prev) => [...prev, clean].slice(0, 8)); setTagInput(""); };
  const clearAttachedImages = () => setImages((prev) => { prev.forEach((image) => { if (image.previewUrl) URL.revokeObjectURL(image.previewUrl); }); return []; });
  const resetForm = () => { setType(props.initialType); setTitle(""); setContent(""); setCommunityId(""); setVisibility("todos"); setTags([]); setTagInput(""); clearAttachedImages(); };

  if (!props.open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm" onClick={props.onClose}><div role="dialog" aria-modal className="mx-auto mt-3 max-h-[93vh] w-full max-w-[1000px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Crear publicación</h2><p className="text-sm text-slate-500">Publica texto e imágenes en el feed principal.</p></div><button className="rounded-lg p-1 hover:bg-slate-100" onClick={props.onClose}><X size={18} /></button></div>
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{([{ id: "publicacion", icon: MessageSquarePlus, label: "Publicación" }, { id: "apunte", icon: NotebookPen, label: "Apunte" }, { id: "pregunta", icon: MessageCircle, label: "Pregunta" }, { id: "momento", icon: Sparkles, label: "Momento" }, { id: "debate", icon: AlignLeft, label: "Debate" }, { id: "tramite", icon: FileUp, label: "Trámite" }] as const).map(({ id, icon: Icon, label }) => <button key={id} onClick={() => id === "publicacion" ? setType(id) : props.onToast(blockedMessages[id], "info")} className={`rounded-xl border px-2 py-2 text-left ${type === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"} ${id !== "publicacion" ? "opacity-70" : ""}`}><Icon size={14} /><p className="text-xs font-semibold">{label}</p></button>)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-3"><div className="space-y-3 lg:col-span-2">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Comparte una idea, recurso o experiencia con tu comunidad..." className="w-full rounded-xl border px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold">Adjuntar imagen/video<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (images.length >= MAX_FEED_IMAGES) return props.onToast(`Por ahora puedes subir hasta ${MAX_FEED_IMAGES} archivos multimedia.`, "info"); const mediaId = crypto.randomUUID(); setImages((prev) => [...prev, { id: mediaId, mediaId, previewUrl: URL.createObjectURL(f), type: f.type.startsWith("video/") ? "video" : "image" }]); }} /></label></div>
      <FeedAttachmentPreview files={[]} images={images} onRemoveImage={(id) => setImages((prev) => prev.filter((img) => img.id !== id))} />
      {!hasContent ? <p className="text-xs text-rose-600">Agrega texto, imagen o video para publicar.</p> : null}
    </div><div className="space-y-3"><select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="">Feed general</option>{props.communities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select>
      <select value={visibility} onChange={(e) => setVisibility(e.target.value as "todos" | "comunidad")} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="todos">Visible para todos</option><option value="comunidad">Solo en comunidad</option></select>
      <div className="rounded-xl border p-3"><p className="text-sm font-bold">Vista previa</p>{!hasContent ? <p className="mt-2 text-xs text-slate-500">Tu vista previa aparecerá aquí.</p> : <div className="mt-2 space-y-2 text-xs"><p className="font-semibold">Tú</p><p className="text-slate-500">Publicación · Feed general · {visibility === "todos" ? "Visible para todos" : "Solo comunidad"}</p><p className="text-slate-700">{content}</p><FeedAttachmentPreview files={[]} images={images} /></div>}</div>
      <div className="rounded-xl border p-3"><div className="flex flex-wrap gap-1">{suggestedTags.map((tag) => <button key={tag} onClick={() => addTag(tag)} className="rounded-full border px-2 py-1 text-xs">{tag}</button>)}</div><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} className="mt-2 w-full rounded border px-2 py-1 text-xs" placeholder="Etiqueta" /></div>
    </div></div>
    <div className="mt-4 flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm" onClick={props.onClose}>Cancelar</button><button disabled={!canSubmit} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={async () => { const payload: CreatePostSubmitPayload = { type: "publicacion", title, content, visibility, communityId, tags, attachedFiles: [], attachedImages: images }; await props.onSubmit(payload); resetForm(); props.onClose(); }}>Publicar</button></div>
  </div></div>;
}
