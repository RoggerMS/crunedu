"use client";

import type { Community, CreateFeedPostPayload } from "@crunedu/shared";
import { Loader2, MessageCircle, Package, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-3xl font-black tracking-tight">¿Qué está pasando en La Cantuta?</h1>

        <form onSubmit={handleSubmit} className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black">¿Qué quieres compartir?</h2>

          <div className="mt-4 space-y-4">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Comparte tu duda, experiencia o aporte"
              required
            />

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
              placeholder="Título (opcional)"
            />

            <select
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
            </select>

            {!isAuthenticated ? (
              <p className="text-sm text-slate-600">
                Inicia sesión para publicar. {" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Ir a login
                </Link>
              </p>
            ) : null}

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              Publicar
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-slate-500">Cargando publicaciones...</p></div> : null}
          {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">Error: {error}</div> : null}
          {!loading && !error && posts.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-slate-700">No hay publicaciones aún.</p></div> : null}

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
                </article>
              ))
            : null}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><UsersRound className="text-indigo-600" /><h3 className="mt-3 font-black">Comunidades iniciales</h3><p className="mt-2 text-sm text-slate-600">General, Trámites, Apuntes y Cachimbos.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><Package className="text-indigo-600" /><h3 className="mt-3 font-black">Tienda básica</h3><p className="mt-2 text-sm text-slate-600">Productos destacados y consultas sin pagos automáticos.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><MessageCircle className="text-indigo-600" /><h3 className="mt-3 font-black">Preguntas</h3><p className="mt-2 text-sm text-slate-600">Q&A con respuestas útiles.</p></div>
      </aside>
    </div>
  );
}
