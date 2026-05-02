"use client";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useEffect, useState } from "react";
import { apiRequest, mapApiError } from "@/lib/http-client";

type CommunityDetail = { id: number; name: string; description: string | null; rules: string | null };
type CommunityPost = { id: number; title: string; content: string };
type CommunityPostsResponse = { items: CommunityPost[]; nextCursor: number | null };

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAccessToken();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [feed, setFeed] = useState<CommunityPostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const communityId = Number(params.id);
  async function load(cursor?: number) {
    setLoading(true);
    try {
      setError(null);
      const [communityResponse, postsResponse] = await Promise.all([
        apiRequest<CommunityDetail>(`/communities/${communityId}`),
        apiRequest<CommunityPostsResponse>(`/communities/${communityId}/posts?limit=5${cursor ? `&cursor=${cursor}` : ""}`),
      ]);
      setCommunity(communityResponse);
      setFeed(postsResponse);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar la comunidad."));
    } finally {
      setLoading(false);
    }
  }
  async function joinOrLeave(action: "join" | "leave") {
    try {
      await apiRequest(`/communities/${communityId}/${action}`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      await load();
    } catch (err) {
      setError(mapApiError(err, "No se pudo actualizar tu suscripción a la comunidad."));
    }
  }
  useEffect(() => {
    if (!Number.isNaN(communityId)) load();
  }, [communityId]);
  if (loading) return <p className="text-slate-600">Cargando comunidad...</p>;
  if (error) return <p className="text-rose-700">{error}</p>;
  if (!community) return <p className="text-slate-600">No se encontró la comunidad.</p>;
  return <section className="space-y-6"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-3xl font-black">{community.name}</h1><p className="mt-2 text-slate-600">{community.description || "Sin descripción"}</p><p className="mt-2 text-sm text-slate-500">Reglas: {community.rules || "Sin reglas definidas"}</p><div className="mt-4 flex gap-2"><button onClick={() => joinOrLeave("join")} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Unirme</button><button onClick={() => joinOrLeave("leave")} className="rounded-xl border border-slate-300 px-4 py-2">Salir</button></div></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">Publicaciones recientes</h2><div className="mt-4 space-y-4">{feed?.items?.length ? feed.items.map((post) => <article key={post.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{post.title || "Sin título"}</h3><p className="mt-2 text-sm text-slate-700">{post.content}</p></article>) : <p className="text-slate-500">No hay publicaciones aún.</p>}</div></div></section>;
}
