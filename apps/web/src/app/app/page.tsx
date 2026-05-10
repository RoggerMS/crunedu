"use client";

import type { Community, CreateFeedPostPayload, CreatePostImagePayload, PostComment } from "@crunedu/shared";
import { ImagePlus, Loader2, MessageSquarePlus, NotebookPen, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";
import { Card, EmptyState, FormField, Input, PrimaryButton, SecondaryButton, Select, StatusMessage, TextArea } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/http-client";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
}

function parseJwtPayload(token: string): { sub?: number } | null {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson) as { sub?: number };
  } catch {
    return null;
  }
}

const publishOptions = [
  { id: "publicacion", label: "Publicación", helper: "Comparte ideas o recursos con tu comunidad." },
  { id: "apunte", label: "Apunte", helper: "Sube materiales de estudio en un flujo dedicado.", href: "/app/apuntes/nuevo" },
  { id: "pregunta", label: "Pregunta", helper: "Haz una pregunta y recibe respuestas.", href: "/app/preguntas/nuevo" },
  { id: "momento", label: "Momento", helper: "Comparte algo breve y memorable.", href: "/app/momentos" },
  { id: "debate", label: "Debate", helper: "Inicia una conversación académica.", href: "/app/debates/crear" },
  { id: "tramite", label: "Trámite", helper: "Comparte convocatorias o procesos.", href: "/app/tramites" },
] as const;

export default function AppPage() {
  const { communities } = useCommunities();
  const { posts, sections, loading, error, reload } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();

  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachedImages, setAttachedImages] = useState<CreatePostImagePayload[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedPublishOption, setSelectedPublishOption] = useState<(typeof publishOptions)[number]["id"]>("publicacion");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<number, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState<Record<number, boolean>>({});
  const [commentErrorByPost, setCommentErrorByPost] = useState<Record<number, string | null>>({});
  const [commentSuccessByPost, setCommentSuccessByPost] = useState<Record<number, string | null>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);

  const authenticatedUserId = useMemo(() => (accessToken ? (parseJwtPayload(accessToken)?.sub ?? null) : null), [accessToken]);
  const canSubmit = useMemo(() => content.trim() && communityId.trim() && isAuthenticated, [content, communityId, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) { /* unchanged */
    event.preventDefault();
    if (!isAuthenticated) return setFormError("Inicia sesión para publicar.");
    setSubmitting(true); setFormError(null); setSuccessMessage(null);
    const payload: CreateFeedPostPayload = { content: content.trim(), communityId: Number(communityId), images: attachedImages };
    try {
      await apiRequest("/posts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
      setContent(""); setCommunityId(""); setAttachedImages([]); setSuccessMessage("Publicación creada correctamente."); await reload();
      setIsCreateFormOpen(false);
    } catch (err) { setFormError(err instanceof Error ? mapApiError(err, "No se pudo publicar. Verifica tus datos.") : "Ocurrió un error inesperado."); }
    finally { setSubmitting(false); }
  }

  async function handleAttachImage(file: File | null) {
    if (!file || !accessToken) return;
    setUploadingImage(true);
    try {
      const formData = new FormData(); formData.append("image", file);
      const uploaded = await apiRequest<CreatePostImagePayload>("/posts/images", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
      setAttachedImages((prev) => [...prev, uploaded].slice(0, 4));
    } catch (err) { setFormError(mapApiError(err, "No se pudo subir la imagen. Usa JPG, PNG o WEBP de hasta 3MB.")); }
    finally { setUploadingImage(false); }
  }

  async function loadComments(postId: number) { /* unchanged */
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    setCommentErrorByPost((prev) => ({ ...prev, [postId]: null }));
    try {
      const comments = await apiRequest<PostComment[]>(`/posts/${postId}/comments`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    }
    catch (err) { setCommentErrorByPost((prev) => ({ ...prev, [postId]: mapApiError(err, "No se pudieron cargar los comentarios.") })); }
    finally { setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false })); }
  }

  async function handleCreateComment(postId: number) { /* unchanged */
    if (!isAuthenticated) return setCommentErrorByPost((prev) => ({ ...prev, [postId]: "Inicia sesión para comentar." }));
    const contentValue = commentInputs[postId]?.trim() ?? "";
    if (!contentValue) return setCommentErrorByPost((prev) => ({ ...prev, [postId]: "Escribe un comentario antes de publicar." }));
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      await apiRequest(`/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ content: contentValue }) });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setCommentSuccessByPost((prev) => ({ ...prev, [postId]: "Comentario publicado correctamente." }));
      await Promise.all([loadComments(postId), reload()]);
    } catch (err) { setCommentErrorByPost((prev) => ({ ...prev, [postId]: mapApiError(err, "No se pudo publicar el comentario.") })); }
    finally { setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false })); }
  }

  return <div className="space-y-5">
    <Card className="space-y-4">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Feed principal</h1>
      <p className="text-sm text-slate-600">Publica apuntes, preguntas y avances desde un flujo más ordenado.</p>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <button type="button" onClick={() => setIsCreateFormOpen(true)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-500 hover:border-indigo-300">¿Qué quieres compartir con tu comunidad?</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <PrimaryButton type="button" onClick={() => setIsCreateFormOpen(true)} className="w-full justify-center"><MessageSquarePlus size={16} /> Publicar</PrimaryButton>
        <Link href="/app/apuntes/nuevo" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><NotebookPen size={16} /> Crear apunte</Link>
        <Link href="/app/preguntas/nuevo" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Publicar pregunta</Link>
        <Link href="/app/debates/crear" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Sparkles size={16} /> Iniciar debate</Link>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-600">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Para ti</span>
        <span className="rounded-full border border-slate-200 px-3 py-1">Siguiendo</span>
        <span className="rounded-full border border-slate-200 px-3 py-1">Todas las comunidades</span>
      </div>
    </Card>
    {isCreateFormOpen ? <Card className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black">¿Qué quieres compartir?</h2><button type="button" onClick={() => setIsCreateFormOpen(false)} className="text-sm font-semibold text-slate-500">Cerrar</button></div>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{publishOptions.map((option) => option.href ? <Link key={option.id} href={option.href} className="rounded-xl border border-slate-200 p-3 text-sm hover:border-indigo-300"><p className="font-bold text-slate-800">{option.label}</p><p className="mt-1 text-xs text-slate-500">{option.helper}</p></Link> : <button key={option.id} type="button" onClick={() => setSelectedPublishOption(option.id)} className={`rounded-xl border p-3 text-left text-sm ${selectedPublishOption === option.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}><p className="font-bold text-slate-800">{option.label}</p><p className="mt-1 text-xs text-slate-500">{option.helper}</p></button>)}</div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField><p className="text-sm font-semibold text-slate-700">Escribe tu publicación</p><TextArea value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="Comparte algo útil con tu comunidad..." required /></FormField>
        <FormField><p className="text-sm font-semibold text-slate-700">Selecciona una comunidad</p><Select value={communityId} onChange={(event) => setCommunityId(event.target.value)} required><option value="">Selecciona una comunidad</option>{communities.map((community: Community) => <option key={community.id} value={community.id}>{community.name}</option>)}</Select></FormField>
        <FormField><p className="text-sm font-semibold text-slate-700">Agregar imágenes (opcional)</p><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleAttachImage(event.target.files?.[0] ?? null)} disabled={!isAuthenticated || uploadingImage || attachedImages.length >= 4} /><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{attachedImages.map((image) => <img key={image.storageKey} src={image.imageUrl} alt="Vista previa" className="h-20 w-full rounded-xl object-cover" />)}</div><p className="mt-1 text-xs text-slate-500">Máximo 4 imágenes.</p></FormField>
        {formError ? <StatusMessage type="error">{formError}</StatusMessage> : null}
        {successMessage ? <StatusMessage type="success">{successMessage}</StatusMessage> : null}
        <div className="flex gap-2"><SecondaryButton type="button" onClick={() => setIsCreateFormOpen(false)}>Cancelar</SecondaryButton><PrimaryButton type="submit" disabled={!canSubmit || submitting}>{submitting ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Publicar</PrimaryButton></div>
      </form>
    </Card> : null}
    <div className="mt-6 grid gap-4 xl:grid-cols-12">{loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}{error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      <div className="space-y-4 xl:col-span-8">
        {!loading && !error && posts.length === 0 ? <EmptyState title="No hay publicaciones aún" description="Comienza creando tu primera publicación." action={<PrimaryButton onClick={() => setIsCreateFormOpen(true)}>Crear primera publicación</PrimaryButton>} /> : null}
        {!loading && !error ? sections.map((section) => <div key={section.key} className="space-y-4"><h3 className="text-lg font-bold text-slate-800">{section.title}</h3>{section.items.map((post) => <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{post.community?.name ?? "General"} · {post.commentsCount} comentarios</p><p className="mt-2 text-slate-600">{post.content}</p>{post.images?.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{post.images.map((image) => <Image key={image.id} src={image.imageUrl} alt="Imagen de publicación" width={320} height={200} className="h-32 w-full rounded-xl object-cover" />)}</div> : null}<div className="mt-4 text-sm font-semibold text-slate-500">Autor: {buildAuthorName(post.author.firstName, post.author.lastName, post.author.email)} · {new Date(post.createdAt).toLocaleString("es-PE")}</div><div className="mt-3 rounded-2xl border border-slate-200 p-4"><button type="button" onClick={async () => { if (activeCommentPostId === post.id) return setActiveCommentPostId(null); setActiveCommentPostId(post.id); if (!commentsByPost[post.id]) await loadComments(post.id); }} className="text-sm font-bold text-indigo-600">{activeCommentPostId === post.id ? "Cerrar comentarios" : "Comentar"}</button>{activeCommentPostId === post.id ? <div className="mt-3 space-y-2">{(commentsByPost[post.id] ?? []).map((comment) => <div key={comment.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm text-slate-700">{comment.content}</p></div>)}<textarea rows={2} value={commentInputs[post.id] ?? ""} onChange={(event) => setCommentInputs((prev) => ({ ...prev, [post.id]: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Escribe un comentario" /><PrimaryButton type="button" onClick={() => void handleCreateComment(post.id)} disabled={commentLoadingByPost[post.id]}>Comentar</PrimaryButton>{commentErrorByPost[post.id] ? <p className="text-sm text-red-600">{commentErrorByPost[post.id]}</p> : null}{commentSuccessByPost[post.id] ? <p className="text-sm text-emerald-600">{commentSuccessByPost[post.id]}</p> : null}</div> : null}</div>{isAuthenticated && authenticatedUserId === post.author.id ? <p className="mt-3 text-xs text-slate-500">La edición y eliminación siguen disponibles desde API; UI compacta aplicada.</p> : null}</article>)}</div>) : null}
      </div>
      <aside className="hidden space-y-4 xl:col-span-4 xl:block">
        <Card className="space-y-3">
          <h3 className="text-sm font-black text-slate-800">Comunidades recomendadas</h3>
          {communities.slice(0, 4).map((community) => <div key={community.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"><p className="text-sm font-semibold text-slate-700">{community.name}</p><Link href={`/app/comunidades/${community.id}`} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Unirse</Link></div>)}
        </Card>
        <Card className="space-y-3">
          <h3 className="text-sm font-black text-slate-800">Temas en tendencia</h3>
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">#ParcialEstadística · #SesiónDeTiempo · #Cachimbos</p>
        </Card>
      </aside>
    </div>
  </div>;
}
