"use client";

import { BookOpen, Camera, Grid2X2, Info, MapPin, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, mapApiError } from "@/lib/http-client";

type PublicProfileData = {
  id: number; fullName: string; username?: string | null; headline?: string | null; bio: string; avatarUrl: string | null; coverUrl?: string | null; coverPositionY?: number; currentCity?: string | null; hometown?: string | null;
  academicInfo: { faculty: string | null; career: string | null; cycle: string | null };
  activeCommunities: Array<{ id: number; name: string; slug: string }>;
  recentPosts: Array<{ id: number; title: string; content: string; createdAt: string; community: { id: number; name: string } | null }>;
  stats: { posts: number; followers: number; following: number };
  relationship: { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean };
  isMine: boolean;
};

type ProfilePost = { id: number; title: string; content: string; createdAt: string; visibility: string; inFeed: boolean; images: Array<{ id: number; imageUrl: string; mimeType: string }>; community: { id: number; name: string } | null; commentsCount: number; likesCount: number };

export function PublicProfile({ userId }: { userId: number }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [tab, setTab] = useState<"posts" | "about" | "media">("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [profileData, postsData] = await Promise.all([
        apiRequest<PublicProfileData>(`/users/${userId}`, { headers: authHeaders }),
        apiRequest<{ items: ProfilePost[] }>(`/users/${userId}/posts`, { headers: authHeaders }),
      ]);
      setProfile(profileData); setPosts(postsData.items ?? []);
    } catch (requestError) { setError(mapApiError(requestError, "No se pudo cargar este perfil.")); }
    finally { setLoading(false); }
  }, [accessToken, userId]);

  useEffect(() => { void load(); }, [load]);

  async function toggleFollow() {
    if (!profile || !isAuthenticated) return;
    setFollowLoading(true);
    try {
      const relationship = await apiRequest<PublicProfileData["relationship"]>(`/follows/${profile.id}`, { method: profile.relationship.isFollowing ? "DELETE" : "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const difference = relationship.isFollowing ? 1 : -1;
      setProfile({ ...profile, relationship, stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers + difference) } });
    } finally { setFollowLoading(false); }
  }

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Cargando perfil...</div>;
  if (error || !profile) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error || "Perfil no disponible."}</div>;

  const initial = profile.fullName.charAt(0).toUpperCase();
  const media = posts.flatMap((post) => post.images.map((image) => ({ ...image, postId: post.id })));
  const tabs = [{ id: "posts" as const, label: "Publicaciones", icon: Grid2X2 }, { id: "about" as const, label: "Información", icon: Info }, { id: "media" as const, label: "Multimedia", icon: Camera }];

  return <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="h-48 bg-gradient-to-br from-indigo-700 via-indigo-500 to-cyan-400 bg-cover bg-center" style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})`, backgroundPosition: `center ${profile.coverPositionY ?? 50}%` } : undefined} />
    <div className="px-5 pb-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-14 flex items-end gap-4"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-4xl font-black text-indigo-700 shadow-sm">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" /> : initial}</div><div className="pb-1"><h1 className="text-3xl font-black text-slate-950">{profile.fullName}</h1>{profile.username ? <p className="text-sm font-semibold text-indigo-700">@{profile.username}</p> : null}{profile.headline ? <p className="text-sm text-slate-600">{profile.headline}</p> : null}{profile.relationship.isFriend ? <p className="text-sm font-semibold text-emerald-700">Se siguen mutuamente</p> : profile.relationship.isFollowedBy ? <p className="text-sm text-slate-500">Te sigue</p> : null}</div></div>
        {profile.isMine ? <Link href="/app/configuracion-perfil" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-indigo-700">Editar perfil</Link> : isAuthenticated ? <button onClick={() => void toggleFollow()} disabled={followLoading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${profile.relationship.isFollowing ? "border border-slate-300 text-slate-700" : "bg-indigo-600 text-white"}`}><UserPlus size={16} />{followLoading ? "Guardando..." : profile.relationship.isFollowing ? "Dejar de seguir" : "Seguir"}</button> : <Link href={`/login?returnUrl=/app/perfil/${profile.id}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white">Inicia sesión para seguir</Link>}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-700">{profile.bio || "Este estudiante todavía no agregó una biografía."}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><MapPin size={15} />{profile.currentCity || profile.academicInfo.faculty || "Ubicación no indicada"}</span><span className="inline-flex items-center gap-1"><BookOpen size={15} />{profile.academicInfo.career || "Carrera no indicada"}{profile.academicInfo.cycle ? ` · ${profile.academicInfo.cycle}` : ""}</span></div>
      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center"><div><p className="text-xl font-black">{profile.stats.posts}</p><p className="text-xs text-slate-500">Publicaciones</p></div><div><p className="text-xl font-black">{profile.stats.followers}</p><p className="text-xs text-slate-500">Seguidores</p></div><div><p className="text-xl font-black">{profile.stats.following}</p><p className="text-xs text-slate-500">Siguiendo</p></div></div>
      <nav className="mt-6 flex gap-2 border-b border-slate-200">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${tab === id ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500"}`}><Icon size={16} />{label}</button>)}</nav>

      {tab === "posts" ? <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]"><div><h2 className="text-lg font-black">Publicaciones</h2><div className="mt-3 space-y-3">{posts.length ? posts.map((post) => <Link key={post.id} href={`/app?post=${post.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30"><h3 className="font-bold">{post.title || "Publicación"}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content}</p><p className="mt-2 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString("es-PE")}{post.community ? ` · ${post.community.name}` : ""} · {post.likesCount} me gusta</p></Link>) : <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Todavía no hay publicaciones visibles.</p>}</div></div><Communities profile={profile} /></div> : null}
      {tab === "about" ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><InfoCard title="Información académica" rows={[profile.academicInfo.faculty, profile.academicInfo.career, profile.academicInfo.cycle]} /><InfoCard title="Lugares" rows={[profile.currentCity && `Vive en ${profile.currentCity}`, profile.hometown && `De ${profile.hometown}`]} /><Communities profile={profile} /></div> : null}
      {tab === "media" ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{media.length ? media.map((image) => <Link key={image.id} href={`/app?post=${image.postId}`} className="aspect-square overflow-hidden rounded-2xl bg-slate-100"><img src={image.imageUrl} alt="Multimedia del perfil" className="h-full w-full object-cover" /></Link>) : <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No hay fotos públicas en este perfil.</p>}</div> : null}
    </div>
  </section>;
}

function Communities({ profile }: { profile: PublicProfileData }) { return <aside><h2 className="inline-flex items-center gap-2 text-lg font-black"><Users size={18} /> Comunidades</h2><div className="mt-3 flex flex-wrap gap-2">{profile.activeCommunities.length ? profile.activeCommunities.map((community) => <Link key={community.id} href={`/app/comunidades/${community.id}`} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{community.name}</Link>) : <p className="text-sm text-slate-500">Sin comunidades públicas.</p>}</div></aside>; }
function InfoCard({ title, rows }: { title: string; rows: Array<string | null | undefined> }) { const visible = rows.filter(Boolean); return <div className="rounded-2xl border border-slate-200 p-4"><h3 className="font-black text-slate-900">{title}</h3>{visible.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{visible.map((row) => <li key={row}>{row}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Sin información registrada.</p>}</div>; }
