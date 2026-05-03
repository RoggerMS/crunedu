"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ModuleHeader } from "@/components/module-header";
import { PageState, PrimaryButton } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/api-helpers";
import { useAccessToken } from "@/hooks/useAccessToken";

type PostDetail = { id: number; title: string; content: string; createdAt: string; commentsCount: number; author: { email: string; firstName: string | null; lastName: string | null } };
type PostComment = { id: number; content: string; createdAt: string; user: { email: string; firstName: string | null; lastName: string | null } };

export default function ProcedureDetailPage() {
  const params = useParams<{ id: string }>();
  const procedureId = Number(params?.id);
  const { accessToken, isAuthenticated } = useAccessToken();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");

  async function loadData() {
    if (!Number.isFinite(procedureId)) return;
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        apiRequest<PostDetail>(`/posts/${procedureId}`),
        apiRequest<PostComment[]>(`/posts/${procedureId}/comments`),
      ]);
      setPost(postData);
      setComments(commentsData);
      setError(null);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar el trámite."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [procedureId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !commentContent.trim()) return;
    try {
      await apiRequest(`/posts/${procedureId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: commentContent.trim() }),
      });
      setCommentContent("");
      await loadData();
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar tu comentario."));
    }
  }

  if (loading) return <PageState type="loading" title="Cargando trámite" description="Estamos cargando el detalle y comentarios." />;
  if (error) return <PageState type="error" title="Error" description={error} />;
  if (!post) return <PageState type="empty" title="Trámite no encontrado" description="Este trámite no está disponible." />;

  return (
    <section className="space-y-5">
      <ModuleHeader title={post.title || "Trámite"} description="Detalle completo del trámite y conversación de estudiantes." />
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Publicado: {new Date(post.createdAt).toLocaleString("es-PE")}</p>
        <p className="mt-3 whitespace-pre-wrap text-slate-800">{post.content}</p>
      </article>

      <section className="space-y-3">
        <h2 className="text-lg font-black">Comentarios ({comments.length})</h2>
        {comments.length === 0 ? <p className="text-sm text-slate-600">Aún no hay comentarios. Sé la primera persona en opinar.</p> : null}
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm text-slate-800">{comment.content}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString("es-PE")}</p>
          </article>
        ))}
      </section>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-semibold text-slate-800">Comparte tu opinión sobre este trámite</label>
          <textarea value={commentContent} onChange={(event) => setCommentContent(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Escribe tu comentario" />
          <PrimaryButton type="submit">Publicar comentario</PrimaryButton>
        </form>
      ) : (
        <p className="text-sm text-slate-600">Inicia sesión para comentar en este trámite.</p>
      )}
    </section>
  );
}
