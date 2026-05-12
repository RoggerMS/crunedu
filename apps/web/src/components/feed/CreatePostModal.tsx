import { AlignLeft, FileUp, ImagePlus, MessageCircle, MessageSquarePlus, NotebookPen, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import { MAX_FEED_IMAGES } from "./constants";
import type { CommunityLite, CreatePostSubmitPayload, LocalAttachmentFile, PostType } from "./types";

const suggestedTags = ["recurso", "consejo", "comunidad", "universidad"];

const config = {
  publicacion: { label: "Publicación", submit: "Publicar", requiresTitle: false, titleLabel: "Título", placeholder: "Comparte una idea, recurso o experiencia con tu comunidad...", subtitle: "Comparte contenido útil para tu comunidad." },
  apunte: { label: "Apunte", submit: "Publicar apunte", requiresTitle: true, titleLabel: "Título del apunte", placeholder: "Describe qué contiene tu apunte y cómo puede ayudar.", subtitle: "Comparte material académico con orden y contexto." },
  pregunta: { label: "Pregunta", submit: "Publicar pregunta", requiresTitle: true, titleLabel: "¿Cuál es tu duda?", placeholder: "Agrega contexto: qué intentaste, en qué parte te trabaste y qué necesitas entender.", subtitle: "Haz preguntas claras para recibir mejores respuestas." },
  momento: { label: "Momento", submit: "Publicar momento", requiresTitle: false, titleLabel: "Título (opcional)", placeholder: "Comparte una experiencia, logro, exposición o recuerdo universitario.", subtitle: "Muestra experiencias universitarias valiosas." },
  debate: { label: "Debate", submit: "Crear debate", requiresTitle: true, titleLabel: "Tema del debate", placeholder: "Presenta el tema, el contexto y la pregunta que quieres debatir.", subtitle: "Abre discusión con postura y argumentos." },
  tramite: { label: "Trámite", submit: "Publicar trámite", requiresTitle: true, titleLabel: "Título del trámite", placeholder: "Explica requisitos, pasos, fechas, oficina responsable o enlace útil.", subtitle: "Ayuda con procesos universitarios importantes." },
};

const types: Array<{ id: PostType; icon: typeof MessageSquarePlus }> = [
  { id: "publicacion", icon: MessageSquarePlus }, { id: "apunte", icon: NotebookPen }, { id: "pregunta", icon: MessageCircle }, { id: "momento", icon: Sparkles }, { id: "debate", icon: AlignLeft }, { id: "tramite", icon: FileUp },
];

export function CreatePostModal(props: { open: boolean; initialType: PostType; communities: CommunityLite[]; isAuthenticated: boolean; onClose: () => void; onSaveDraft: (data: CreatePostSubmitPayload) => void; onSubmit: (data: CreatePostSubmitPayload) => void; onToast: (message: string, type: "success" | "error" | "info") => void }) {
  const [type, setType] = useState<PostType>(props.initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseName, setCourseName] = useState("");
  const [stance, setStance] = useState("");
  const [deadline, setDeadline] = useState("");
  const [visibility, setVisibility] = useState<"todos" | "comunidad">("todos");
  const [communityId, setCommunityId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<LocalAttachmentFile[]>([]);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [touched, setTouched] = useState({ title: false, content: false });

  useEffect(() => setType(props.initialType), [props.initialType, props.open]);
  const conf = config[type];
  const hasContent = Boolean(title.trim() || content.trim() || files.length || images.length || tags.length);
  const hasValidContent = Boolean(content.trim().length >= 1 || files.length > 0 || images.length > 0);
  const canSubmit = props.isAuthenticated && hasValidContent && (!conf.requiresTitle || title.trim()) && (visibility !== "comunidad" || communityId);
  const showValidation = hasTriedSubmit || touched.title || touched.content;
  const validationText = useMemo(() => {
    if (!showValidation) return null;
    if (!props.isAuthenticated) return "Inicia sesión para publicar contenido.";
    if (conf.requiresTitle && !title.trim()) return "Agrega un título para este tipo de publicación.";
    if (!content.trim() && !files.length && !images.length) return "Agrega texto, una imagen, un archivo o contenido para publicar.";
    if (visibility === "comunidad" && !communityId) return "Selecciona una comunidad o cambia la visibilidad.";
    return null;
  }, [showValidation, props.isAuthenticated, conf.requiresTitle, title, content, files.length, images.length, visibility, communityId]);

  const addTag = (raw: string) => {
    const clean = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!clean) return;
    if (clean.length > 24) return setError("Cada etiqueta debe tener máximo 24 caracteres.");
    if (tags.includes(clean)) return;
    if (tags.length >= 8) return setError("Solo puedes agregar hasta 8 etiquetas.");
    setTags((prev) => [...prev, clean]);
    setTagInput("");
    setError(null);
  };

  if (!props.open) return null;

  return <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm" onClick={props.onClose}>
    <div role="dialog" aria-modal className="mx-auto mt-3 max-h-[93vh] w-full max-w-[1000px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Crear publicación</h2><p className="text-sm text-slate-500">{conf.subtitle}</p></div><button aria-label="Cerrar" className="rounded-lg p-1 hover:bg-slate-100" onClick={props.onClose}><X size={18} /></button></div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{types.map(({ id, icon: Icon }) => {
        const disabled = id !== "publicacion";
        return <button key={id} title={disabled ? `Próximamente se integrará con ${config[id].label === "Trámite" ? "Universidad/Trámites" : `${config[id].label}s`}.` : undefined} onClick={() => disabled ? props.onToast("Próximamente podrás crear este contenido desde su módulo correspondiente.", "info") : setType(id)} className={`rounded-xl border px-2 py-2 text-left transition ${type === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}><Icon size={14} /><p className="text-xs font-semibold">{config[id].label}</p></button>;
      })}</div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {(conf.requiresTitle || type === "momento") ? <input value={title} onBlur={() => setTouched((t) => ({ ...t, title: true }))} onChange={(e) => setTitle(e.target.value)} placeholder={conf.titleLabel} className="w-full rounded-xl border px-3 py-2 text-sm" /> : null}
          {type === "apunte" ? <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Curso o asignatura (opcional)" className="w-full rounded-xl border px-3 py-2 text-sm" /> : null}
          {type === "debate" ? <select value={stance} onChange={(e) => setStance(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="">Postura inicial (opcional)</option><option>A favor</option><option>En contra</option><option>Neutral / quiero escuchar opiniones</option></select> : null}
          {type === "tramite" ? <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" /> : null}
          <textarea value={content} onBlur={() => setTouched((t) => ({ ...t, content: true }))} onChange={(e) => setContent(e.target.value)} rows={8} placeholder={conf.placeholder} className="w-full rounded-xl border px-3 py-2 text-sm" />
          {type === "pregunta" ? <p className="text-xs text-slate-500">Mientras más contexto agregues, mejores respuestas recibirás.</p> : null}
          {type === "apunte" ? <p className="text-xs text-slate-500">Ideal para PDF, DOCX, PPT o resúmenes de clase.</p> : null}
          <div className="flex flex-wrap gap-2">
            <label className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold ${type === "apunte" ? "border-indigo-300 bg-indigo-50" : ""}`}>Adjuntar archivo<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (files.length >= 1) return setError("Solo puedes adjuntar 1 archivo por publicación."); setFiles([{ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type, file: f }]); setError(null); }} /></label>
            <label className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold ${type === "momento" ? "border-indigo-300 bg-indigo-50" : ""}`}>Adjuntar imagen<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (images.length >= MAX_FEED_IMAGES) return setError(`Por ahora puedes subir hasta ${MAX_FEED_IMAGES} imágenes.`); const reader = new FileReader(); reader.onload = () => setImages((prev) => [...prev, { id: crypto.randomUUID(), url: String(reader.result ?? "") }]); reader.readAsDataURL(f); setError(null); }} /></label>
          </div>
          <p className="text-xs text-slate-500">Puedes agregar hasta {MAX_FEED_IMAGES} imágenes.</p>
          <FeedAttachmentPreview files={files} images={images} onRemoveFile={(id) => setFiles((p) => p.filter((f) => f.id !== id))} onRemoveImage={(id) => setImages((p) => p.filter((img) => img.id !== id))} />
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          {validationText ? <p className="text-xs text-rose-600">{validationText}</p> : null}
        </div>

        <div className="space-y-3">
          <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="">Feed general</option>{props.communities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "todos" | "comunidad")} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="todos">Visible para todos</option><option value="comunidad">Solo en comunidad</option></select>
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold text-slate-600">Etiquetas sugeridas</p>
            <div className="mt-2 flex flex-wrap gap-1">{suggestedTags.map((tag) => <button key={tag} onClick={() => addTag(tag)} disabled={tags.includes(tag)} className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40">{tag}</button>)}</div>
            <p className="mt-3 text-xs font-semibold text-slate-600">Etiquetas seleccionadas</p>
            <div className="mt-2 flex flex-wrap gap-1">{tags.map((tag) => <button key={tag} onClick={() => setTags((prev) => prev.filter((it) => it !== tag))} className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">#{tag} ×</button>)}</div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} placeholder="Escribe una etiqueta y presiona Enter" className="mt-2 w-full rounded-lg border px-2 py-1 text-xs" />
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-sm font-bold">Vista previa</p>
            {!hasContent ? <p className="mt-2 text-xs text-slate-500">Tu vista previa aparecerá aquí.</p> : <div className="mt-2 space-y-2 text-xs"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">Tú</span><div><p className="font-semibold">Tú</p><p className="text-slate-500">{conf.label} · {props.communities.find((c) => String(c.id) === communityId)?.name ?? "Feed general"} · {visibility === "todos" ? "Visible para todos" : "Solo comunidad"}</p></div></div>{title.trim() ? <p className="font-semibold">{title}</p> : null}{content ? <p className="line-clamp-3 text-slate-600">{content}</p> : null}<div className="flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700">#{tag}</span>)}</div><FeedAttachmentPreview files={files} images={images} /></div>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm" onClick={props.onClose}>Cancelar</button><button className="rounded-xl border px-4 py-2 text-sm" onClick={() => { if (!hasContent) return props.onToast("No hay contenido para guardar como borrador.", "info"); props.onSaveDraft({ type, title, content, courseName, stance, deadline, visibility, communityId, tags, attachedFiles: files, attachedImages: images }); props.onClose(); }}>Guardar borrador</button><button disabled={!canSubmit} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={() => { setHasTriedSubmit(true); if (!canSubmit) return; props.onSubmit({ type, title, content, courseName, stance, deadline, visibility, communityId, tags, attachedFiles: files, attachedImages: images }); }}>{conf.submit}</button></div>
    </div>
  </div>;
}
