"use client";

import type { Community, CreateFeedPostPayload, PostComment } from "@crunedu/shared";
import { Loader2, MessageCircle, Package, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";
import { Card, EmptyState, FormField, Input, PrimaryButton, SecondaryButton, Select, StatusMessage, TextArea } from "@/components/ui";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
}

function parseJwtPayload(token: string): { sub?: number } | null {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) {
      return null;
    }

    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson) as { sub?: number };
  } catch {
    return null;
  }
}

export default function AppPage() {
  const { communities } = useCommunities();
  const { posts, loading, error, reload } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingCommunityId, setEditingCommunityId] = useState("");
  const [postActionLoadingId, setPostActionLoadingId] = useState<number | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [postActionSuccess, setPostActionSuccess] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<number, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState<Record<number, boolean>>({});
  const [commentErrorByPost, setCommentErrorByPost] = useState<Record<number, string | null>>({});

  const authenticatedUserId = useMemo(() => {
    if (!accessToken) {
      return null;
    }

    return parseJwtPayload(accessToken)?.sub ?? null;
  }, [accessToken]);

  const canSubmit = useMemo(() => content.trim() && communityId.trim() && isAuthenticated, [content, communityId, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setFormError("Inicia sesión para publicar.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    const payload: CreateFeedPostPayload = {
      title: title.trim() || undefined,
      content: content.trim(),
      communityId: Number(communityId),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo publicar. Verifica tus datos.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      setTitle("");
      setContent("");
      setCommunityId("");
      setSuccessMessage("Publicación creada correctamente.");
      await reload();
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(postId: number, initialTitle: string, initialContent: string, initialCommunityId: number | null) {
    setEditingPostId(postId);
    setEditingTitle(initialTitle);
    setEditingContent(initialContent);
    setEditingCommunityId(initialCommunityId ? String(initialCommunityId) : "");
    setPostActionError(null);
    setPostActionSuccess(null);
  }

  async function handleUpdatePost(postId: number) {
    if (!isAuthenticated) {
      setPostActionError("Inicia sesión para editar publicaciones.");
      return;
    }

    setPostActionLoadingId(postId);
    setPostActionError(null);
    setPostActionSuccess(null);

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: editingTitle.trim() || undefined,
          content: editingContent.trim(),
          communityId: Number(editingCommunityId),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo actualizar la publicación.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      setEditingPostId(null);
      setPostActionSuccess("Publicación actualizada correctamente.");
      await reload();
    } catch (err) {
      setPostActionError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setPostActionLoadingId(null);
    }
  }

  async function handleDeletePost(postId: number) {
    if (!isAuthenticated) {
      setPostActionError("Inicia sesión para eliminar publicaciones.");
      return;
    }

    setPostActionLoadingId(postId);
    setPostActionError(null);
    setPostActionSuccess(null);

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo eliminar la publicación.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      setPostActionSuccess("Publicación eliminada correctamente.");
      await reload();
    } catch (err) {
      setPostActionError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setPostActionLoadingId(null);
    }
  }


  async function handleReport(targetType: "POST" | "COMMENT", targetId: number) {
    if (!isAuthenticated) {
      setPostActionError("Inicia sesión para reportar contenido.");
      return;
    }

    setPostActionLoadingId(targetId);
    setPostActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ targetType, targetId, reason: "Contenido inapropiado" }),
      });
      if (!response.ok) throw new Error("No se pudo reportar el contenido.");
      setPostActionSuccess("Reporte enviado correctamente.");
    } catch (err) {
      setPostActionError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setPostActionLoadingId(null);
    }
  }

  async function loadComments(postId: number) {
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    setCommentErrorByPost((prev) => ({ ...prev, [postId]: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}/comments`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudieron cargar los comentarios.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      const comments = (await response.json()) as PostComment[];
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (err) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: err instanceof Error ? err.message : "Error inesperado al cargar comentarios." }));
    } finally {
      setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleCreateComment(postId: number) {
    if (!isAuthenticated) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: "Inicia sesión para comentar." }));
      return;
    }

    const contentValue = commentInputs[postId]?.trim() ?? "";
    if (!contentValue) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: "Escribe un comentario antes de publicar." }));
      return;
    }

    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    setCommentErrorByPost((prev) => ({ ...prev, [postId]: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: contentValue }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo publicar el comentario.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      await Promise.all([loadComments(postId), reload()]);
    } catch (err) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: err instanceof Error ? err.message : "Ocurrió un error inesperado." }));
    } finally {
      setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-3xl font-black tracking-tight">¿Qué está pasando en La Cantuta?</h1>

        <Card className="mt-5">
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-black">¿Qué quieres compartir?</h2>

          <div className="mt-4 space-y-4">
            <FormField><p className="text-sm font-semibold text-slate-700">Contenido de la publicación</p><TextArea
              id="post-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Comparte tu duda, experiencia o aporte"
              required
            /></FormField>

            <FormField><p className="text-sm font-semibold text-slate-700">Título (opcional)</p><Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Título (opcional)"
            /></FormField>

            <FormField><p className="text-sm font-semibold text-slate-700">Selecciona una comunidad</p><Select
              value={communityId}
              onChange={(event) => setCommunityId(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
              required
            >
              <option value="">Selecciona una comunidad</option>
              {communities.map((community: Community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </Select></FormField>

            {!isAuthenticated ? (
              <p className="text-sm text-slate-600">
                Inicia sesión para publicar. {" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Ir a login
                </Link>
              </p>
            ) : null}

            {formError ? <StatusMessage type="error">{formError}</StatusMessage> : null}
            {successMessage ? <StatusMessage type="success">{successMessage}</StatusMessage> : null}

            <PrimaryButton type="submit" className="w-full sm:w-auto" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              Publicar
            </PrimaryButton>
          </div>
        </form>
        </Card>

        <div className="mt-6 space-y-4">
          {loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
          {error ? <StatusMessage type="error">Error: {error}</StatusMessage> : null}
          {!loading && !error && posts.length === 0 ? <EmptyState title="No hay publicaciones aún" description="Sé la primera persona en compartir una duda o aporte para tu comunidad." action={<PrimaryButton onClick={() => document.getElementById("post-content")?.focus()}>Crear primera publicación</PrimaryButton>} /> : null}

          {!loading && !error
            ? posts.map((post) => (
                <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{post.community?.name ?? "General"} · {post.commentsCount} comentarios</p>
                  {post.title ? <h2 className="mt-2 text-xl font-bold">{post.title}</h2> : null}
                  <p className="mt-2 text-slate-600">{post.content}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                    <span>Autor: {buildAuthorName(post.author.firstName, post.author.lastName, post.author.email)}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleString("es-PE")}</span>
                  </div>
                  <button type="button" onClick={() => handleReport("POST", post.id)} className="mt-3 rounded-xl border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700">Reportar</button>
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-700">Comentarios</h3>
                    <div className="mt-3 space-y-3">
                      <button type="button" onClick={() => loadComments(post.id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Ver comentarios</button>
                      {commentLoadingByPost[post.id] ? <p className="text-sm text-slate-500">Cargando comentarios...</p> : null}
                      {commentErrorByPost[post.id] ? <p className="text-sm text-red-600">{commentErrorByPost[post.id]}</p> : null}
                      {(commentsByPost[post.id] ?? []).map((comment) => (
                        <div key={comment.id} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-sm text-slate-700">{comment.content}</p>
                          <p className="mt-1 text-xs text-slate-500">{buildAuthorName(comment.author.firstName, comment.author.lastName, comment.author.email)} · {new Date(comment.createdAt).toLocaleString("es-PE")}</p>
                          <button type="button" onClick={() => handleReport("COMMENT", comment.id)} className="mt-2 rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700">Reportar</button>
                        </div>
                      ))}

                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={commentInputs[post.id] ?? ""}
                          onChange={(event) => setCommentInputs((prev) => ({ ...prev, [post.id]: event.target.value }))}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          placeholder="Escribe un comentario"
                        />
                        <button type="button" onClick={() => handleCreateComment(post.id)} disabled={commentLoadingByPost[post.id]} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-indigo-300">Comentar</button>
                      </div>
                    </div>
                  </div>
                  {isAuthenticated && authenticatedUserId === post.author.id ? (
                    <div className="mt-4 space-y-3">
                      {editingPostId === post.id ? (
                        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                          <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Título (opcional)" />
                          <textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" rows={4} />
                          <select value={editingCommunityId} onChange={(event) => setEditingCommunityId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                            <option value="">Selecciona una comunidad</option>
                            {communities.map((community: Community) => (
                              <option key={community.id} value={community.id}>
                                {community.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleUpdatePost(post.id)} disabled={postActionLoadingId === post.id} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-indigo-300">Guardar</button>
                            <button type="button" onClick={() => setEditingPostId(null)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEditing(post.id, post.title, post.content, post.community?.id ?? null)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Editar</button>
                          <button type="button" onClick={() => handleDeletePost(post.id)} disabled={postActionLoadingId === post.id} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">Eliminar</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              ))
            : null}
          {postActionLoadingId ? <p className="text-sm text-slate-500">Procesando acción...</p> : null}
          {postActionSuccess ? <p className="text-sm text-emerald-600">{postActionSuccess}</p> : null}
          {postActionError ? <p className="text-sm text-red-600">{postActionError}</p> : null}
        </div>
      </section>

      <aside className="space-y-4">
        <Card>
          <Sparkles className="text-indigo-600" />
          <h3 className="mt-3 font-black">Onboarding rápido</h3>
          <p className="mt-2 text-sm text-slate-600">1) Elige tus comunidades de interés. 2) Publica tu primer aporte guiado en el feed.</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/app/comunidades" className="text-sm font-semibold text-indigo-600">
              Elegir comunidades
            </Link>
            <p className="text-xs text-slate-500">Tip: empieza en Cachimbos o General.</p>
          </div>
        </Card>
        <Card><UsersRound className="text-indigo-600" /><h3 className="mt-3 font-black">Comunidades iniciales</h3><p className="mt-2 text-sm text-slate-600">General, Trámites, Apuntes y Cachimbos.</p></Card>
        <Card><Package className="text-indigo-600" /><h3 className="mt-3 font-black">Tienda básica</h3><p className="mt-2 text-sm text-slate-600">Productos destacados y consultas sin pagos automáticos.</p></Card>
        <Card><MessageCircle className="text-indigo-600" /><h3 className="mt-3 font-black">Preguntas</h3><p className="mt-2 text-sm text-slate-600">Q&A con respuestas útiles.</p></Card>
      </aside>
    </div>
  );
}
