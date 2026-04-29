"use client";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useEffect, useState } from "react";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAccessToken();
  const [community, setCommunity] = useState<any>(null);
  const [feed, setFeed] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const communityId = Number(params.id);
  async function load(page = 1) {
    setLoading(true);
    const [communityResponse, postsResponse] = await Promise.all([
      fetch(`${API_URL}/communities/${communityId}`),
      fetch(`${API_URL}/communities/${communityId}/posts?page=${page}&pageSize=5`),
    ]);
    setCommunity(await communityResponse.json());
    setFeed(await postsResponse.json());
    setLoading(false);
  }
  async function joinOrLeave(action: "join" | "leave") {
    await fetch(`${API_URL}/communities/${communityId}/${action}`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    await load(feed?.page ?? 1);
  }
  useEffect(() => {
    if (!Number.isNaN(communityId)) load();
  }, [communityId]);
  if (loading) return <p className="text-slate-600">Cargando comunidad...</p>;
  return <section className="space-y-6"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-3xl font-black">{community.name}</h1><p className="mt-2 text-slate-600">{community.description || "Sin descripción"}</p><p className="mt-2 text-sm text-slate-500">Reglas: {community.rules || "Sin reglas definidas"}</p><div className="mt-4 flex gap-2"><button onClick={() => joinOrLeave("join")} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Unirme</button><button onClick={() => joinOrLeave("leave")} className="rounded-xl border border-slate-300 px-4 py-2">Salir</button></div></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold">Publicaciones recientes</h2><div className="mt-4 space-y-4">{feed?.data?.length ? feed.data.map((post: any) => <article key={post.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{post.title || "Sin título"}</h3><p className="mt-2 text-sm text-slate-700">{post.content}</p></article>) : <p className="text-slate-500">No hay publicaciones aún.</p>}</div></div></section>;
}
