"use client";

import { useAccessToken } from "@/hooks/useAccessToken";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, mapApiError } from "@/lib/http-client";

type CommunityDetail = {
  id: number;
  name: string;
  description: string | null;
  rules: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
};

type CommunityMembership = {
  isJoined: boolean;
  role: string | null;
  isCreator: boolean;
};

type CommunityPost = { id: number; title: string; content: string };
type CommunityPostsResponse = {
  items: CommunityPost[];
  nextCursor: number | null;
};

function parseJwtRole(token: string): string | null {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { accessToken } = useAccessToken();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [feed, setFeed] = useState<CommunityPostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const communityId = Number(params.id);
  const isAdmin = useMemo(() => (accessToken ? parseJwtRole(accessToken) === "ADMIN" : false), [accessToken]);

  async function load(cursor?: number) {
    setLoading(true);
    try {
      setError(null);
      const [communityResponse, postsResponse] = await Promise.all([
        apiRequest<CommunityDetail>(`/communities/${communityId}`),
        apiRequest<CommunityPostsResponse>(
          `/communities/${communityId}/posts?limit=10${cursor ? `&cursor=${cursor}` : ""}`,
        ),
      ]);
      setCommunity(communityResponse);
      setFeed(postsResponse);

      if (accessToken) {
        const membership = await apiRequest<CommunityMembership>(`/communities/${communityId}/membership`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setIsJoined(membership.isJoined);
        setIsCreator(membership.isCreator);
      } else {
        setIsJoined(false);
        setIsCreator(false);
      }
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar la comunidad."));
    } finally {
      setLoading(false);
    }
  }

  async function joinOrLeave(action: "join" | "leave") {
    if (!accessToken) {
      setError("Inicia sesión para gestionar tu suscripción a esta comunidad.");
      return;
    }
    try {
      await apiRequest(`/communities/${communityId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await load();
    } catch (err) {
      setError(
        mapApiError(
          err,
          "No se pudo actualizar tu suscripción a la comunidad.",
        ),
      );
    }
  }

  const filteredPosts = useMemo(() => {
    const items = feed?.items ?? [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((post) =>
      `${post.title} ${post.content}`.toLowerCase().includes(term),
    );
  }, [feed?.items, searchTerm]);

  useEffect(() => {
    if (!Number.isNaN(communityId)) void load();
  }, [communityId, accessToken]);

  if (loading) return <p className="text-slate-600">Cargando comunidad...</p>;
  if (error) return <p className="text-rose-700">{error}</p>;
  if (!community)
    return <p className="text-slate-600">No se encontró la comunidad.</p>;

  const initial = community.name.charAt(0).toUpperCase();

  return (
    <section className="space-y-6">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="h-40 bg-slate-200">
          {community.coverUrl ? (
            <img
              src={community.coverUrl}
              alt={`Portada de ${community.name}`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="-mt-8 px-6 pb-6">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-indigo-50">
            {community.avatarUrl ? (
              <img
                src={community.avatarUrl}
                alt={community.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-black text-indigo-700">
                {initial}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                {community.name}
              </h1>
              <p className="mt-1 text-slate-600">
                {community.description || "Sin descripción"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isCreator ? (
                isJoined ? (
                  <button
                    onClick={() => void joinOrLeave("leave")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Salir
                  </button>
                ) : (
                  <button
                    onClick={() => void joinOrLeave("join")}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Unirme
                  </button>
                )
              ) : (
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Eres creador de esta comunidad
                </span>
              )}
              <button
                onClick={() => setShowSearch((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Buscar
              </button>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                ⋯
              </button>
            </div>
          </div>
          {showMenu ? (
            <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <button
                onClick={() =>
                  alert("Comparte este grupo con el enlace actual.")
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
              >
                Compartir comunidad
              </button>
              <button
                onClick={() =>
                  alert("Invita a tus compañeros a esta comunidad.")
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
              >
                Invitar al grupo
              </button>
              <button
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
              >
                {notificationsEnabled
                  ? "Desactivar notificaciones"
                  : "Activar notificaciones"}
              </button>
              {isAdmin ? (
                <>
                  <button
                    onClick={() => alert("Próximamente podrás editar nombre y descripción desde aquí.")}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                  >
                    Editar comunidad
                  </button>
                  <button
                    onClick={() => alert("Próximamente podrás cambiar la portada desde aquí.")}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                  >
                    Editar portada
                  </button>
                  <button
                    onClick={() => alert("Próximamente podrás cambiar entre pública y privada.")}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                  >
                    Cambiar privacidad (pública/privada)
                  </button>
                </>
              ) : null}
              <button
                onClick={() =>
                  alert("Reporte enviado. Gracias por ayudarnos a moderar.")
                }
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm text-rose-700"
              >
                Reportar comunidad
              </button>
            </div>
          ) : null}
          {showSearch ? (
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar publicaciones dentro de la comunidad"
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          ) : null}
          <p className="mt-3 text-sm text-slate-500">
            Reglas: {community.rules || "Sin reglas definidas"}
          </p>
        </div>
      </article>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Publicaciones recientes</h2>
        <div className="mt-4 space-y-4">
          {filteredPosts.length ? (
            filteredPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <h3 className="font-bold text-slate-900">
                  {post.title || "Sin título"}
                </h3>
                <p className="mt-2 text-sm text-slate-700">{post.content}</p>
              </article>
            ))
          ) : (
            <p className="text-slate-500">
              No hay resultados para tu búsqueda.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
