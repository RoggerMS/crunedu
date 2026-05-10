"use client";

import type { Community, CreateFeedPostPayload, CreatePostImagePayload, FeedPost, PostComment } from "@crunedu/shared";
import { AlignLeft, Bold, Bookmark, Code2, FileUp, ImagePlus, Italic, Link2, List, Loader2, MessageCircle, MessageSquarePlus, NotebookPen, Send, Sparkles, Underline, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";
import { Card, EmptyState, FormField, Input, PrimaryButton, Select, StatusMessage, TextArea } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/http-client";

const typeOptions = [
  { id: "publicacion", label: "Publicación", helper: "Comparte ideas, recursos o novedades.", icon: MessageSquarePlus },
  { id: "apunte", label: "Apunte", helper: "Comparte apuntes y materiales de estudio.", icon: NotebookPen },
  { id: "pregunta", label: "Pregunta", helper: "Haz una pregunta a tu comunidad.", icon: MessageCircle },
  { id: "momento", label: "Momento memorable", helper: "Comparte experiencias que inspiran.", icon: Sparkles },
  { id: "debate", label: "Debate", helper: "Inicia un debate sobre un tema académico.", icon: AlignLeft },
  { id: "tramite", label: "Trámite", helper: "Comparte trámites y convocatorias.", icon: FileUp },
] as const;

const quickActions = ["publicacion", "apunte", "pregunta", "momento", "debate", "tramite"] as const;

export default function AppPage() {
  const { communities } = useCommunities();
  const { posts, loading, error, reload } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<(typeof typeOptions)[number]["id"]>("publicacion");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [visibility, setVisibility] = useState("todos");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(["estadística", "parcial", "resumen"]);
  const [attachedImages, setAttachedImages] = useState<CreatePostImagePayload[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [localPosts, setLocalPosts] = useState<Array<{ id: number; title: string; content: string; author: string; meta: string; tags: string[] }>>([]);

  const simulatedPosts = useMemo(() => [
    { id: 10001, title: "Resumen de Distribuciones de Probabilidad", content: "He preparado este resumen con ejemplos resueltos para el parcial.", author: "Kevin Rojas", meta: "Estadística Aplicada · hace 2 h", tags: ["probabilidad", "resumen"] },
    { id: 10002, title: "Método Simplex – Ejemplo paso a paso", content: "Comparto el procedimiento que usamos en clase para maximización.", author: "Diego Morales", meta: "Investigación de Operaciones · hace 4 h", tags: ["simplex", "apunte"] },
    { id: 10003, title: "¿Cómo resolver este límite cuando x tiende a 0?", content: "No entiendo el paso de factorización, ¿alguien puede explicarlo?", author: "Valeria Torres", meta: "Cálculo I · hace 5 h", tags: ["pregunta", "cálculo"] },
    { id: 10004, title: "Debate: ¿La IA mejora realmente el aprendizaje universitario?", content: "¿Nos ayuda a aprender mejor o solo a resolver más rápido?", author: "Ana López", meta: "Debates académicos · hace 6 h", tags: ["debate", "ia"] },
    { id: 10005, title: "Trámite destacado: Solicitud de constancia de estudios 2026", content: "Dejo pasos y requisitos actualizados para evitar observaciones.", author: "Centro de Ayuda CrunEdu", meta: "Trámites · hace 8 h", tags: ["trámite", "constancia"] },
  ], []);

  const canSubmit = isAuthenticated && content.trim().length > 0 && communityId;

  function openComposer(type: (typeof typeOptions)[number]["id"]) {
    setSelectedType(type);
    setIsCreateFormOpen(true);
  }

  function addTag() {
    const clean = tagInput.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagInput("");
  }

  async function handleAttachImage(file: File | null) {
    if (!file || !accessToken) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploaded = await apiRequest<CreatePostImagePayload>("/posts/images", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
      setAttachedImages((prev) => [...prev, uploaded].slice(0, 4));
    } catch (err) {
      setToast(mapApiError(err, "No se pudo subir la imagen."));
    } finally {
      setUploadingImage(false);
    }
  }

  function handleSaveDraft() {
    setIsCreateFormOpen(false);
    setToast("Borrador guardado correctamente.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const payload: CreateFeedPostPayload = { content: content.trim(), communityId: Number(communityId), images: attachedImages };
    try {
      await apiRequest("/posts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
      setLocalPosts((prev) => [{ id: Date.now(), title: `${typeOptions.find((it) => it.id === selectedType)?.label}: nueva publicación`, content: content.trim(), author: "Tú", meta: "Tu comunidad · ahora", tags }, ...prev]);
      setContent("");
      setAttachedImages([]);
      setCommunityId("");
      setIsCreateFormOpen(false);
      setToast("¡Publicación realizada correctamente!");
      await reload();
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="relative space-y-4">
    {toast ? <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xl">{toast}</div> : null}
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">CR</div>
        <button onClick={() => openComposer("publicacion")} className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-left text-sm text-slate-500 hover:border-indigo-300">¿Qué quieres compartir con tu comunidad?</button>
      </div>
      <div className="flex flex-wrap gap-2">{quickActions.map((action) => {
        const item = typeOptions.find((it) => it.id === action)!;
        const Icon = item.icon;
        const primary = action === "publicacion";
        return <button key={action} onClick={() => openComposer(action)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${primary ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200"}`}><Icon size={14} />{item.label}</button>;
      })}</div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-semibold">
        <div className="flex gap-2"><span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Para ti</span><span className="rounded-full border px-3 py-1">Siguiendo</span><span className="rounded-full border px-3 py-1">Todas las comunidades</span></div>
        <button className="rounded-full border px-3 py-1">Más recientes</button>
      </div>
    </Card>

    {isCreateFormOpen ? <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm p-4 pt-12">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">¿Qué quieres compartir?</h2><button onClick={() => setIsCreateFormOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{typeOptions.map((item) => { const Icon = item.icon; const active = selectedType === item.id; return <button key={item.id} onClick={() => setSelectedType(item.id)} className={`rounded-xl border p-3 text-left ${active ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}><Icon size={16} className={active ? "text-indigo-600" : "text-slate-500"} /><p className="mt-1 text-sm font-bold">{item.label}</p><p className="text-xs text-slate-500">{item.helper}</p></button>; })}</div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Card className="space-y-2 p-3"><p className="text-xs font-bold">Importar contenido (opcional)</p><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm font-semibold text-slate-600 hover:border-indigo-300">Subir archivo o arrastra aquí<Input type="file" className="hidden" /></label><p className="text-xs text-slate-500">PDF, DOCX, PPTX, imágenes o ZIP (máx. 25 MB)</p></Card>
              <Card className="space-y-2 p-3"><p className="text-xs font-bold">Agregar imágenes</p><div className="grid grid-cols-4 gap-2">{attachedImages.map((image) => <Image key={image.storageKey} src={image.imageUrl} width={80} height={70} alt="preview" className="h-16 w-full rounded-lg object-cover" />)}<label className="flex h-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500"><ImagePlus size={14} /><Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleAttachImage(event.target.files?.[0] ?? null)} disabled={uploadingImage} /></label></div></Card>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Escribe tu publicación</p>
              <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 p-2 text-slate-600"><button type="button"><Bold size={14} /></button><button type="button"><Italic size={14} /></button><button type="button"><Underline size={14} /></button><button type="button"><Link2 size={14} /></button><button type="button"><List size={14} /></button><button type="button"><AlignLeft size={14} /></button><button type="button"><ImagePlus size={14} /></button><button type="button"><Code2 size={14} /></button></div>
              <TextArea value={content} onChange={(event) => setContent(event.target.value)} rows={10} placeholder="Comparte algo con tu comunidad..." className="rounded-t-none" required />
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <FormField><p className="mb-1 text-xs font-bold">Visibilidad</p><Select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="todos">Todos</option><option value="comunidad">Solo mi comunidad</option><option value="privado">Privado</option></Select></FormField>
            <FormField><p className="mb-1 text-xs font-bold">Comunidad</p><Select value={communityId} onChange={(event) => setCommunityId(event.target.value)} required><option value="">Selecciona una comunidad</option>{communities.map((community: Community) => <option key={community.id} value={community.id}>{community.name}</option>)}</Select></FormField>
            <FormField><p className="mb-1 text-xs font-bold">Etiquetas</p><div className="rounded-xl border border-slate-200 p-2"><div className="mb-2 flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{tag}</span>)}</div><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} placeholder="Agregar etiqueta" className="w-full text-sm outline-none" /></div></FormField>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={handleSaveDraft} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Guardar borrador</button><PrimaryButton type="submit" disabled={!canSubmit || submitting}>{submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Publicar</PrimaryButton></div>
        </form>
      </div>
    </div> : null}

    {loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
    {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
    <div className="grid gap-4 xl:grid-cols-12">
      <section className="space-y-3 xl:col-span-8">
        {localPosts.map((post) => <Card key={post.id} className="space-y-3 p-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-indigo-100" /><div><p className="text-sm font-bold">{post.author}</p><p className="text-xs text-slate-500">{post.meta}</p></div></div><h3 className="text-base font-black text-slate-800">{post.title}</h3><p className="text-sm text-slate-600">{post.content}</p><div className="flex flex-wrap gap-1">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{tag}</span>)}</div><div className="flex gap-4 text-xs font-semibold text-slate-500"><span>👍 12</span><span>💬 4</span><span>🔖 Guardar</span><span>↗ Compartir</span></div></Card>)}
        {simulatedPosts.map((post) => <Card key={post.id} className="space-y-3 p-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-indigo-100" /><div><p className="text-sm font-bold">{post.author}</p><p className="text-xs text-slate-500">{post.meta}</p></div></div><h3 className="text-base font-black text-slate-800">{post.title}</h3><p className="text-sm text-slate-600">{post.content}</p><div className="flex flex-wrap gap-1">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{tag}</span>)}</div><div className="flex gap-4 text-xs font-semibold text-slate-500"><span>👍 128</span><span>💬 24</span><span><Bookmark size={12} className="inline" /> Guardar</span><span>↗ Compartir</span></div></Card>)}
        {!loading && !error && posts.length === 0 ? <EmptyState title="No hay publicaciones aún" description="Comienza creando tu primera publicación." action={<PrimaryButton onClick={() => openComposer("publicacion")}>Crear primera publicación</PrimaryButton>} /> : null}
      </section>
      <aside className="space-y-3 xl:col-span-4">
        <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Comunidades recomendadas</h3>{communities.slice(0, 4).map((community) => <div key={community.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"><p className="text-sm">{community.name}</p><button className="rounded-full border px-2 py-1 text-xs">Unirse</button></div>)}</Card>
        <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Temas en tendencia</h3><p className="text-xs text-slate-600">#ParcialEstadística · #MétodoSimplex · #Constancias2026</p></Card>
        <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Actividad reciente</h3><p className="text-xs text-slate-600">Ana respondió una pregunta de Cálculo · hace 15 min</p><p className="text-xs text-slate-600">Nuevo apunte en Física General · hace 40 min</p></Card>
      </aside>
    </div>
  </div>;
}
