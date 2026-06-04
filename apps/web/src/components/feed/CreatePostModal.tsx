import { AlignLeft, FileUp, MessageCircle, MessageSquarePlus, NotebookPen, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import type { CommunityLite, CreatePostSubmitPayload, PostType } from "./types";

const MIN_CONTENT_LENGTH = 20;
const suggestedTags = ["recurso", "consejo", "comunidad", "universidad"];
const blockedMessages: Record<Exclude<PostType, "publicacion">, string> = {
  apunte: "Los apuntes se crearán desde el módulo Apuntes. Luego podrás compartirlos en el feed.",
  pregunta: "Las preguntas se crearán desde Preguntas. Luego podrás compartirlas en el feed.",
  momento: "Los momentos se crearán desde Momentos. Luego podrás compartirlos en el feed.",
  debate: "Los debates se crean desde Conversar, dentro de la pestaña Debates. Luego podrás compartirlos en el feed.",
  tramite: "Los trámites se crearán desde Universidad. Luego podrás compartirlos en el feed.",
};

type CreatePostModalProps = {
  open: boolean;
  initialType: PostType;
  communities: CommunityLite[];
  isAuthenticated: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  onSaveDraft: (data: CreatePostSubmitPayload) => void;
  onSubmit: (data: CreatePostSubmitPayload) => Promise<void> | void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
};

export function CreatePostModal(props: CreatePostModalProps) {
  const [type, setType] = useState<PostType>(props.initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [visibility, setVisibility] = useState<"todos" | "comunidad">("todos");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => setType(props.initialType), [props.initialType, props.open]);

  const selectedCommunity = useMemo(() => props.communities.find((community) => String(community.id) === communityId), [communityId, props.communities]);
  const hasUsefulContent = content.trim().length >= MIN_CONTENT_LENGTH;
  const hasCommunity = communityId.length > 0;
  const canSubmit = type === "publicacion" && hasUsefulContent && hasCommunity;

  const addTag = (raw: string) => {
    const clean = raw.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean].slice(0, 8));
    setTagInput("");
  };

  const resetForm = () => {
    setType(props.initialType);
    setTitle("");
    setContent("");
    setCommunityId("");
    setVisibility("todos");
    setTags([]);
    setTagInput("");
  };

  const submit = async () => {
    if (!props.isAuthenticated) {
      props.onRequireLogin();
      return;
    }

    if (!hasCommunity) {
      props.onToast("Selecciona una comunidad para publicar.", "error");
      return;
    }

    if (!hasUsefulContent) {
      props.onToast("Escribe mínimo 20 caracteres con contexto útil.", "error");
      return;
    }

    const payload: CreatePostSubmitPayload = {
      type: "publicacion",
      title,
      content,
      visibility,
      communityId,
      tags,
      attachedFiles: [],
      attachedImages: [],
    };

    try {
      await props.onSubmit(payload);
      resetForm();
      props.onClose();
    } catch {
      // The page owns the visible API error toast.
    }
  };

  if (!props.open) return null;

  return <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm" onClick={props.onClose}><div role="dialog" aria-modal className="mx-auto mt-3 max-h-[93vh] w-full max-w-[1000px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Crear publicación</h2><p className="text-sm text-slate-500">Publica texto en una comunidad real de CrunEdu.</p></div><button className="rounded-lg p-1 hover:bg-slate-100" onClick={props.onClose}><X size={18} /></button></div>
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{([{ id: "publicacion", icon: MessageSquarePlus, label: "Publicación" }, { id: "apunte", icon: NotebookPen, label: "Apunte" }, { id: "pregunta", icon: MessageCircle, label: "Pregunta" }, { id: "momento", icon: Sparkles, label: "Momento" }, { id: "debate", icon: AlignLeft, label: "Debate" }, { id: "tramite", icon: FileUp, label: "Trámite" }] as const).map(({ id, icon: Icon, label }) => <button key={id} onClick={() => id === "publicacion" ? setType(id) : props.onToast(blockedMessages[id], "info")} className={`rounded-xl border px-2 py-2 text-left ${type === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"} ${id !== "publicacion" ? "opacity-70" : ""}`}><Icon size={14} /><p className="text-xs font-semibold">{label}</p></button>)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-3"><div className="space-y-3 lg:col-span-2">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Ejemplo: Busco recomendaciones para el curso de Cálculo en Cachimbos este semestre." className="w-full rounded-xl border px-3 py-2 text-sm" />
      <p className={hasUsefulContent ? "text-xs text-emerald-700" : "text-xs text-slate-500"}>Mínimo 20 caracteres con contexto útil para que otros estudiantes puedan responder.</p>
      <p className="text-xs text-slate-500">Los adjuntos multimedia se conectarán después; este cierre del loop social guarda texto, autor y comunidad.</p>
    </div><div className="space-y-3"><label className="space-y-1 text-xs font-semibold text-slate-600"><span>Selecciona una comunidad</span><select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm font-normal"><option value="">Selecciona una comunidad</option>{props.communities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select></label>
      {!hasCommunity ? <p className="text-xs text-rose-600">Debes publicar en una comunidad real, como Cachimbos, Apuntes, Trámites o General.</p> : null}
      <select value={visibility} onChange={(e) => setVisibility(e.target.value as "todos" | "comunidad")} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="todos">Visible para todos</option><option value="comunidad">Solo en comunidad</option></select>
      <div className="rounded-xl border p-3"><p className="text-sm font-bold">Vista previa</p>{!content.trim() ? <p className="mt-2 text-xs text-slate-500">Tu vista previa aparecerá aquí.</p> : <div className="mt-2 space-y-2 text-xs"><p className="font-semibold">Tú</p><p className="text-slate-500">Publicación · {selectedCommunity?.name ?? "Selecciona una comunidad"} · {visibility === "todos" ? "Visible para todos" : "Solo comunidad"}</p><p className="text-slate-700">{content}</p><FeedAttachmentPreview files={[]} images={[]} /></div>}</div>
      <div className="rounded-xl border p-3"><div className="flex flex-wrap gap-1">{suggestedTags.map((tag) => <button key={tag} onClick={() => addTag(tag)} className="rounded-full border px-2 py-1 text-xs">{tag}</button>)}</div><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} className="mt-2 w-full rounded border px-2 py-1 text-xs" placeholder="Etiqueta" /></div>
    </div></div>
    <div className="mt-4 flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm" onClick={props.onClose}>Cancelar</button><button disabled={!canSubmit} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={submit}>{props.isAuthenticated ? "Publicar" : "Inicia sesión para publicar"}</button></div>
  </div></div>;
}
