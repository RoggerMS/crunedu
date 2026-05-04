"use client";

import type { Community, CreateFeedPostPayload, CreatePostImagePayload, PostComment } from "@crunedu/shared";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";
import { Card, EmptyState, FormField, Input, PrimaryButton, SecondaryButton, Select, StatusMessage, TextArea } from "@/components/ui";
import { apiRequest } from "@/lib/http-client";
import { mapApiError } from "@/lib/http-client";


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
  const { posts, sections, loading, error, reload } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();

  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachedImages, setAttachedImages] = useState<CreatePostImagePayload[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingCommunityId, setEditingCommunityId] = useState("");
  const [postActionLoadingId, setPostActionLoadingId] = useState<number | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [postActionSuccess, setPostActionSuccess] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<number, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState<Record<number, boolean>>({});
  const [commentErrorByPost, setCommentErrorByPost] = useState<Record<number, string | null>>({});
  const [commentSuccessByPost, setCommentSuccessByPost] = useState<Record<number, string | null>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);

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
      content: content.trim(),
      communityId: Number(communityId),
      images: attachedImages,
    };

    try {
      await apiRequest("/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      setContent("");
      setCommunityId("");
      setAttachedImages([]);
      setSuccessMessage("Publicación creada correctamente.");
      await reload();
    } catch (err) {
      if (err instanceof Error) {
        setFormError(mapApiError(err, "No se pudo publicar. Verifica tus datos."));
      } else {
        setFormError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }


  async function handleAttachImage(file: File | null) {
    if (!file || !accessToken) return;
    setUploadingImage(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploaded = await apiRequest<CreatePostImagePayload>("/posts/images", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      setAttachedImages((prev) => [...prev, uploaded].slice(0, 4));
    } catch (err) {
      setFormError(mapApiError(err, "No se pudo subir la imagen. Usa JPG, PNG o WEBP de hasta 3MB."));
    } finally {
      setUploadingImage(false);
    }
  }

  function startEditing(postId: number, initialContent: string, initialCommunityId: number | null) {
    setEditingPostId(postId);
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
      await apiRequest(`/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          content: editingContent.trim(),
          communityId: Number(editingCommunityId),
        }),
      });

      setEditingPostId(null);
      setPostActionSuccess("Publicación actualizada correctamente.");
      await reload();
    } catch (err) {
      setPostActionError(mapApiError(err));
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
      await apiRequest(`/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setPostActionSuccess("Publicación eliminada correctamente.");
      await reload();
    } catch (err) {
      setPostActionError(mapApiError(err));
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
      await apiRequest("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ targetType, targetId, reason: "Contenido inapropiado" }),
      });
      setPostActionSuccess("Reporte enviado correctamente.");
    } catch (err) {
      setPostActionError(mapApiError(err));
    } finally {
      setPostActionLoadingId(null);
    }
  }

  async function loadComments(postId: number) {
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    setCommentErrorByPost((prev) => ({ ...prev, [postId]: null }));

    try {
      const comments = await apiRequest<PostComment[]>(`/posts/${postId}/comments`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
    } catch (err) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: mapApiError(err, "No se pudieron cargar los comentarios.") }));
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
    setCommentSuccessByPost((prev) => ({ ...prev, [postId]: null }));

    try {
      await apiRequest(`/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: contentValue }),
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setCommentSuccessByPost((prev) => ({ ...prev, [postId]: "Comentario publicado correctamente." }));
      await Promise.all([loadComments(postId), reload()]);
    } catch (err) {
      setCommentErrorByPost((prev) => ({ ...prev, [postId]: mapApiError(err, "No se pudo publicar el comentario.") }));
    } finally {
      setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function toggleCommentPanel(postId: number) {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    if (!commentsByPost[postId]) {
      await loadComments(postId);
    }
  }

  return (
    <div className="space-y-5">
        <Card className="space-y-4">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">¿Qué quieres hacer hoy en CrunEdu?</h1>
          <p className="text-sm text-slate-600">Usa acciones rápidas compactas para mantenerte al día con tu comunidad.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <PrimaryButton
              type="button"
              onClick={() => setIsCreateFormOpen((prev) => !prev)}
              className="w-full justify-center"
            >
              {isCreateFormOpen ? "Cerrar publicación" : "Publicar"}
            </PrimaryButton>
            <SecondaryButton asChild className="w-full justify-center">
              <Link href="/app/comunidades">Explorar comunidades</Link>
            </SecondaryButton>
            <SecondaryButton asChild className="w-full justify-center">
              <Link href="/app/preguntas">Publicar pregunta</Link>
            </SecondaryButton>
          </div>
        </Card>

        {isCreateFormOpen ? (
          <Card>
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

            <FormField><p className="text-sm font-semibold text-slate-700">Imágenes (opcional)</p><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleAttachImage(event.target.files?.[0] ?? null)} disabled={!isAuthenticated || uploadingImage || attachedImages.length >= 4} /><p className="mt-1 text-xs text-slate-500">Máximo 4 imágenes. No se permiten videos MP4 en esta fase.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{attachedImages.map((image) => (<img key={image.storageKey} src={image.imageUrl} alt="Vista previa" loading="lazy" className="h-20 w-full rounded-xl object-cover" />))}</div></FormField>

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
        ) : null}

        <div className="mt-6 space-y-4">
          {loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
          {error ? (
            <div className="space-y-3">
              <StatusMessage type="error">{error}</StatusMessage>
              <PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>
            </div>
          ) : null}
          {!loading && !error && posts.length === 0 ? (
            <EmptyState
              title="No hay publicaciones aún"
              description="Comienza uniéndote a una comunidad o crea tu primera publicación para activar el feed."
              action={(
                <div className="flex flex-col gap-2 sm:flex-row">
                  <PrimaryButton onClick={() => setIsCreateFormOpen(true)}>Crear primera publicación</PrimaryButton>
                  <SecondaryButton asChild>
                    <Link href="/app/comunidades">Únete a tu primera comunidad</Link>
                  </SecondaryButton>
                </div>
              )}
            />
          ) : null}

          {!loading && !error
            ? sections.map((section) => (
                <div key={section.key} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                  {section.items.map((post) => (
                <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{post.community?.name ?? "General"} · {post.commentsCount} comentarios</p>
                                    <p className="mt-2 text-slate-600">{post.content}</p>
                  {post.images?.length ? (<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{post.images.map((image) => (<Image key={image.id} src={image.imageUrl} alt="Imagen de publicación" width={320} height={200} loading="lazy" className="h-32 w-full rounded-xl object-cover" />))}</div>) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                    <span>Autor: {buildAuthorName(post.author.firstName, post.author.lastName, post.author.email)}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleString("es-PE")}</span>
                  </div>
                  <button type="button" onClick={() => handleReport("POST", post.id)} className="mt-3 rounded-xl border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700">Reportar</button>
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <button
                      type="button"
                      onClick={() => void toggleCommentPanel(post.id)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {activeCommentPostId === post.id ? "Cerrar comentarios" : "Comentar"}
                    </button>
                    {activeCommentPostId === post.id ? (
                    <div className="mt-3 space-y-3">
                      {commentLoadingByPost[post.id] ? <p className="text-sm text-slate-500">Cargando comentarios...</p> : null}
                      {commentErrorByPost[post.id] ? <p className="text-sm text-red-600">{commentErrorByPost[post.id]}</p> : null}
                      {commentSuccessByPost[post.id] ? <p className="text-sm text-emerald-600">{commentSuccessByPost[post.id]}</p> : null}
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
                    ) : null}
                  </div>
                  {isAuthenticated && authenticatedUserId === post.author.id ? (
                    <div className="mt-4 space-y-3">
                      {editingPostId === post.id ? (
                        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
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
                          <button type="button" onClick={() => startEditing(post.id, post.content, post.community?.id ?? null)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Editar</button>
                          <button type="button" onClick={() => handleDeletePost(post.id)} disabled={postActionLoadingId === post.id} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">Eliminar</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
                  ))}
                </div>
              ))
            : null}
          {postActionLoadingId ? <p className="text-sm text-slate-500">Procesando acción...</p> : null}
          {postActionSuccess ? <p className="text-sm text-emerald-600">{postActionSuccess}</p> : null}
          {postActionError ? <p className="text-sm text-red-600">{postActionError}</p> : null}
        </div>
    </div>
  );
}
