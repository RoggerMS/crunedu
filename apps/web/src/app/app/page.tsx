"use client";

import type { Community, CreateFeedPostPayload } from "@crunedu/shared";
import { Loader2, MessageCircle, Package, UsersRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
}

export default function AppPage() {
  const { communities } = useCommunities();
  const { posts, loading, error, reload } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => title.trim() && content.trim() && communityId.trim() && jwtToken.trim(),
    [title, content, communityId, jwtToken],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    const payload: CreateFeedPostPayload = {
      title: title.trim(),
      content: content.trim(),
      communityId: Number(communityId),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken.trim()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo publicar. Verifica tu token y tus datos.";
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-3xl font-black tracking-tight">Inicio</h1>
          <p className="mt-2 text-slate-600">Feed general con publicaciones reales de la comunidad.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Crear publicación</h2>
          <p className="mt-1 text-sm text-slate-600">Inicia sesión y pega tu JWT para publicar en una comunidad.</p>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
                placeholder="Escribe un título claro"
                required
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Contenido de la publicación
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={5000}
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
                placeholder="Comparte tu duda, experiencia o aporte"
                required
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Selecciona una comunidad
              <select
                value={communityId}
                onChange={(event) => setCommunityId(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
                required
              >
                <option value="">Selecciona una opción</option>
                {communities.map((community: Community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              JWT de sesión
              <input
                value={jwtToken}
                onChange={(event) => setJwtToken(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring"
                placeholder="Pega aquí tu accessToken"
                required
              />
            </label>

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
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-slate-500">Cargando publicaciones...</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">Error: {error}</div>
          ) : null}

          {!loading && !error && posts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-slate-700">No hay publicaciones aún.</p>
            </div>
          ) : null}

          {!loading && !error
            ? posts.map((post) => (
                <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    {post.community?.name ?? "General"} · {post.commentsCount} comentarios
                  </p>
                  <h2 className="mt-2 text-xl font-bold">{post.title}</h2>
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <UsersRound className="text-indigo-600" />
          <h3 className="mt-3 font-black">Comunidades iniciales</h3>
          <p className="mt-2 text-sm text-slate-600">General, Trámites, Apuntes y Cachimbos.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <Package className="text-indigo-600" />
          <h3 className="mt-3 font-black">Tienda básica</h3>
          <p className="mt-2 text-sm text-slate-600">Productos destacados y consultas sin pagos automáticos.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <MessageCircle className="text-indigo-600" />
          <h3 className="mt-3 font-black">Preguntas</h3>
          <p className="mt-2 text-sm text-slate-600">Q&A con respuestas útiles.</p>
        </div>
      </aside>
    </div>
  );
}
