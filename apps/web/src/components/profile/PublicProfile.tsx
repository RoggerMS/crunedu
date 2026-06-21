"use client";

import { BookOpen, MapPin, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, mapApiError } from "@/lib/http-client";

type PublicProfileData = {
  id: number;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  academicInfo: { faculty: string | null; career: string | null; cycle: string | null };
  activeCommunities: Array<{ id: number; name: string; slug: string }>;
  recentPosts: Array<{ id: number; title: string; content: string; createdAt: string; community: { id: number; name: string } | null }>;
  stats: { posts: number; followers: number; following: number };
  relationship: { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean };
  isMine: boolean;
};

export function PublicProfile({ userId }: { userId: number }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<PublicProfileData>(`/users/${userId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setProfile(data);
    } catch (requestError) {
      setError(mapApiError(requestError, "No se pudo cargar este perfil."));
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => { void load(); }, [load]);

  async function toggleFollow() {
    if (!profile || !isAuthenticated) return;
    setFollowLoading(true);
    try {
      const relationship = await apiRequest<PublicProfileData["relationship"]>(`/follows/${profile.id}`, {
        method: profile.relationship.isFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const difference = relationship.isFollowing ? 1 : -1;
      setProfile({ ...profile, relationship, stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers + difference) } });
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Cargando perfil...</div>;
  if (error || !profile) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error || "Perfil no disponible."}</div>;

  const initial = profile.fullName.charAt(0).toUpperCase();
  return <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="h-44 bg-gradient-to-br from-indigo-700 via-indigo-500 to-cyan-400" />
    <div className="px-5 pb-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-14 flex items-end gap-4"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-4xl font-black text-indigo-700 shadow-sm">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" /> : initial}</div><div className="pb-1"><h1 className="text-3xl font-black text-slate-950">{profile.fullName}</h1>{profile.relationship.isFriend ? <p className="text-sm font-semibold text-emerald-700">Se siguen mutuamente</p> : profile.relationship.isFollowedBy ? <p className="text-sm text-slate-500">Te sigue</p> : null}</div></div>
        {profile.isMine ? <Link href="/app/configuracion-perfil" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-indigo-700">Editar perfil</Link> : isAuthenticated ? <button onClick={() => void toggleFollow()} disabled={followLoading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${profile.relationship.isFollowing ? "border border-slate-300 text-slate-700" : "bg-indigo-600 text-white"}`}><UserPlus size={16} />{followLoading ? "Guardando..." : profile.relationship.isFollowing ? "Dejar de seguir" : "Seguir"}</button> : <Link href={`/login?returnUrl=/app/perfil/${profile.id}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white">Inicia sesión para seguir</Link>}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-700">{profile.bio || "Este estudiante todavía no agregó una biografía."}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={15} />{profile.academicInfo.faculty || "Facultad no indicada"}</span><span className="inline-flex items-center gap-1"><BookOpen size={15} />{profile.academicInfo.career || "Carrera no indicada"}{profile.academicInfo.cycle ? ` · ${profile.academicInfo.cycle}` : ""}</span></div>
      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center"><div><p className="text-xl font-black">{profile.stats.posts}</p><p className="text-xs text-slate-500">Publicaciones</p></div><div><p className="text-xl font-black">{profile.stats.followers}</p><p className="text-xs text-slate-500">Seguidores</p></div><div><p className="text-xl font-black">{profile.stats.following}</p><p className="text-xs text-slate-500">Siguiendo</p></div></div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div><h2 className="text-lg font-black">Publicaciones recientes</h2><div className="mt-3 space-y-3">{profile.recentPosts.length ? profile.recentPosts.map((post) => <Link key={post.id} href={`/app?post=${post.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30"><h3 className="font-bold">{post.title || "Publicación"}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content}</p><p className="mt-2 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString("es-PE")}{post.community ? ` · ${post.community.name}` : ""}</p></Link>) : <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Todavía no tiene publicaciones.</p>}</div></div>
        <aside><h2 className="inline-flex items-center gap-2 text-lg font-black"><Users size={18} /> Comunidades</h2><div className="mt-3 flex flex-wrap gap-2">{profile.activeCommunities.length ? profile.activeCommunities.map((community) => <Link key={community.id} href={`/app/comunidades/${community.id}`} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{community.name}</Link>) : <p className="text-sm text-slate-500">Sin comunidades públicas.</p>}</div></aside>
      </div>
    </div>
  </section>;
}
