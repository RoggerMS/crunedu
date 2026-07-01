"use client";

import { Camera, Link2, MoreHorizontal, Flag, Trash2, UserPlus, BadgeCheck, GraduationCap, MapPin, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, mapApiError, API_BASE_URL } from "@/lib/http-client";
import { PostCard } from "@/components/feed/PostCard";
import { getAvatarInitials } from "@/components/UserIdentityLink";
import { useProfilePosts } from "@/features/feed/useProfilePosts";
import type { FeedPost } from "@/features/feed/feed.types";

type ProfileData = {
  id: number;
  fullName: string;
  username: string | null;
  headline: string | null;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverPositionY: number;
  isVerified: boolean;
  memberSince: string;
  academicInfo: { university: string | null; faculty: string | null; career: string | null; cycle: string | null } | null;
  currentCity: string | null;
  stats: { posts: number; followers: number; following: number; friends: number };
  relationship: { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean };
  sectionVisibility: Record<string, boolean>;
  isMine: boolean;
};

type AboutData = {
  education: any[];
  employment: any[];
  interests: any[];
  languages: any[];
  links: any[];
  places: any[];
  customDetails: any[];
  personalInfo: { birthDate: string | null; gender: string | null; pronouns: string | null; relationshipStatus: string | null };
  isMine: boolean;
};

type Tab = "todo" | "publicaciones" | "informacion" | "multimedia" | "comunidades";

const TABS: { key: Tab; label: string }[] = [
  { key: "todo", label: "Todo" },
  { key: "publicaciones", label: "Publicaciones" },
  { key: "informacion", label: "Información" },
  { key: "multimedia", label: "Multimedia" },
  { key: "comunidades", label: "Comunidades" },
];

export function PublicProfile({ userId }: { userId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isAuthenticated, user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const activeTab = (searchParams.get("tab") as Tab) || "todo";
  const profilePosts = useProfilePosts(userId, accessToken);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ProfileData>(`/users/${userId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setProfile(data);
    } catch (e) {
      setError(mapApiError(e, "No se pudo cargar este perfil."));
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const loadAbout = useCallback(async () => {
    if (about) return;
    try {
      const data = await apiRequest<AboutData>(`/users/${userId}/about`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setAbout(data);
    } catch {
      // silent
    }
  }, [accessToken, userId, about]);

  useEffect(() => {
    if (activeTab === "informacion" || activeTab === "todo") void loadAbout();
  }, [activeTab, loadAbout]);

  async function toggleFollow() {
    if (!profile || !accessToken) return;
    setFollowLoading(true);
    try {
      const rel = await apiRequest<ProfileData["relationship"]>(`/follows/${profile.id}`, {
        method: profile.relationship.isFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const diff = rel.isFollowing ? 1 : -1;
      setProfile({ ...profile, relationship: rel, stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers + diff) } });
    } finally {
      setFollowLoading(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!accessToken) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!resp.ok) throw new Error("Error al subir avatar");
      const data = await resp.json();
      setProfile((p) => p ? { ...p, avatarUrl: data.avatarUrl } : p);
      await refreshUser();
      showToast("Avatar actualizado.", "success");
    } catch {
      showToast("No se pudo subir la imagen.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadCover(file: File) {
    if (!accessToken) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${API_BASE_URL}/users/me/cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!resp.ok) throw new Error("Error al subir portada");
      const data = await resp.json();
      setProfile((p) => p ? { ...p, coverUrl: data.coverUrl } : p);
      await refreshUser();
      showToast("Portada actualizada.", "success");
    } catch {
      showToast("No se pudo subir la portada.", "error");
    } finally {
      setUploadingCover(false);
    }
  }

  async function deleteAvatar() {
    if (!accessToken) return;
    try {
      await apiRequest(`/users/me/avatar`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      setProfile((p) => p ? { ...p, avatarUrl: null } : p);
      await refreshUser();
      showToast("Avatar eliminado.", "success");
    } catch {
      showToast("No se pudo eliminar.", "error");
    }
  }

  async function deleteCover() {
    if (!accessToken) return;
    try {
      await apiRequest(`/users/me/cover`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      setProfile((p) => p ? { ...p, coverUrl: null } : p);
      await refreshUser();
      showToast("Portada eliminada.", "success");
    } catch {
      showToast("No se pudo eliminar.", "error");
    }
  }

  function copyProfileLink() {
    const url = `${window.location.origin}/app/perfil/${userId}`;
    navigator.clipboard.writeText(url).then(() => showToast("Enlace copiado.", "success"));
    setMenuOpen(false);
  }

  async function reportProfile() {
    if (!accessToken) { showToast("Inicia sesión para reportar.", "error"); return; }
    try {
      await apiRequest(`/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "POST", targetId: userId, reason: "Reporte de perfil" }),
      });
      showToast("Reporte enviado.", "success");
    } catch {
      showToast("No se pudo enviar el reporte.", "error");
    }
    setMenuOpen(false);
  }

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/app/perfil/${userId}?${params.toString()}`, { scroll: false });
  }

  if (loading) return <ProfileSkeleton />;
  if (error || !profile) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error || "Perfil no disponible."}</div>;

  const fullName = profile.fullName;
  const initials = getAvatarInitials(fullName);

  const reportFn = (postId: string) => { void profilePosts.reportPost(postId, "Contenido inapropiado"); };
  const editFn = async (post: FeedPost) => {
    if (!post.viewerState.isMine) return;
    const nextContent = window.prompt("Editar contenido:", post.content);
    if (nextContent === null) return;
    if (!nextContent.trim()) return;
    try { await profilePosts.updatePost({ ...post, content: nextContent.trim() }); showToast("Publicación actualizada.", "success"); }
    catch { showToast("No se pudo actualizar.", "error"); }
  };
  const openPost = (id: string) => router.push(`/app?post=${id}`);

  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Cover */}
      <div className="relative h-44 sm:h-52" style={profile.coverUrl ? { backgroundImage: `url(${profile.coverUrl})`, backgroundPosition: `center ${profile.coverPositionY}%`, backgroundSize: "cover" } : { background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
        {profile.isMine ? (
          <>
            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/60" aria-label="Cambiar portada">
              <Camera size={14} /> {uploadingCover ? "Subiendo..." : "Portada"}
            </button>
            {profile.coverUrl ? <button type="button" onClick={deleteCover} className="absolute right-3 bottom-3 rounded-lg bg-black/50 px-2 py-1.5 text-xs text-white hover:bg-rose-600/70" aria-label="Eliminar portada"><Trash2 size={14} /></button> : null}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); e.target.value = ""; }} />
          </>
        ) : null}
      </div>

      <div className="px-4 pb-6 sm:px-6">
        {/* Avatar + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative -mt-16">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-4xl font-black text-indigo-700 shadow-sm sm:h-32 sm:w-32">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={fullName} className="h-full w-full object-cover" /> : initials}
              </div>
              {profile.isMine ? (
                <>
                  <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow hover:bg-indigo-700" aria-label="Cambiar avatar">
                    <Camera size={14} />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ""; }} />
                  {profile.avatarUrl ? <button type="button" onClick={deleteAvatar} className="absolute bottom-1 left-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow hover:bg-rose-600" aria-label="Eliminar avatar"><Trash2 size={14} /></button> : null}
                </>
              ) : null}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-slate-950 sm:text-2xl">{fullName}</h1>
                {profile.isVerified ? <BadgeCheck size={20} className="text-indigo-500" /> : null}
              </div>
              {profile.username ? <p className="text-sm text-slate-500">@{profile.username}</p> : null}
              {profile.headline ? <p className="mt-0.5 text-sm text-slate-600">{profile.headline}</p> : null}
              {profile.relationship.isFriend ? <p className="mt-0.5 text-sm font-semibold text-emerald-600">Amigos</p> : profile.relationship.isFollowedBy ? <p className="mt-0.5 text-sm text-slate-500">Te sigue</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.isMine ? (
              <Link href="/app/configuracion-perfil" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-indigo-700">Editar perfil</Link>
            ) : isAuthenticated ? (
              <button onClick={() => void toggleFollow()} disabled={followLoading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${profile.relationship.isFollowing ? "border border-slate-300 text-slate-700" : "bg-indigo-600 text-white"}`}>
                <UserPlus size={16} /> {followLoading ? "..." : profile.relationship.isFollowing ? "Siguiendo" : "Seguir"}
              </button>
            ) : (
              <Link href={`/login?returnUrl=/app/perfil/${profile.id}`} className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white">Inicia sesión</Link>
            )}
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Más opciones">
                <MoreHorizontal size={18} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <button type="button" onClick={copyProfileLink} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><Link2 size={15} /> Copiar enlace</button>
                  <button type="button" onClick={reportProfile} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"><Flag size={15} /> Reportar perfil</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">{profile.bio}</p> : null}

        {/* Info chips */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
          {profile.academicInfo?.university ? <span className="inline-flex items-center gap-1"><GraduationCap size={15} /> {profile.academicInfo.university}</span> : null}
          {profile.academicInfo?.faculty ? <span className="inline-flex items-center gap-1"><BookOpen size={15} /> {profile.academicInfo.faculty}</span> : null}
          {profile.academicInfo?.career ? <span className="inline-flex items-center gap-1"><BookOpen size={15} /> {profile.academicInfo.career}{profile.academicInfo.cycle ? ` · ${profile.academicInfo.cycle}` : ""}</span> : null}
          {profile.currentCity ? <span className="inline-flex items-center gap-1"><MapPin size={15} /> {profile.currentCity}</span> : null}
          <span className="inline-flex items-center gap-1"><Calendar size={15} /> Se unió en {new Date(profile.memberSince).toLocaleDateString("es-PE", { month: "long", year: "numeric" })}</span>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <button className="flex-1" onClick={() => setTab("publicaciones")}>
            <p className="text-lg font-black text-slate-900">{profile.stats.posts}</p>
            <p className="text-xs text-slate-500">Publicaciones</p>
          </button>
          <button className="flex-1" onClick={() => router.push(`/app/perfil/${userId}?tab=todo`)}>
            <p className="text-lg font-black text-slate-900">{profile.stats.followers}</p>
            <p className="text-xs text-slate-500">Seguidores</p>
          </button>
          <button className="flex-1" onClick={() => router.push(`/app/perfil/${userId}?tab=todo`)}>
            <p className="text-lg font-black text-slate-900">{profile.stats.following}</p>
            <p className="text-xs text-slate-500">Siguiendo</p>
          </button>
          <div className="flex-1">
            <p className="text-lg font-black text-slate-900">{profile.stats.friends}</p>
            <p className="text-xs text-slate-500">Amigos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
          {TABS.map((tab) => (
            <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} onClick={() => setTab(tab.key)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === "todo" ? <TodoTab profile={profile} about={about} posts={profilePosts.posts} loadingPosts={profilePosts.loading} /> : null}
          {activeTab === "publicaciones" ? (
            <div className="space-y-3">
              {profilePosts.loading ? <p className="py-8 text-center text-sm text-slate-500">Cargando publicaciones...</p> : null}
              {!profilePosts.loading && profilePosts.posts.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay publicaciones aún.</p> : null}
              {profilePosts.posts.map((post) => (
                <PostCard key={post.id} post={post} onLike={profilePosts.likePost} onSave={profilePosts.savePost} onShare={profilePosts.sharePost} onReport={reportFn} onHide={profilePosts.hidePost} onDelete={profilePosts.deletePost} onEdit={editFn} onOpenPost={openPost} />
              ))}
              {profilePosts.nextCursor ? <button onClick={() => void profilePosts.loadMore()} disabled={profilePosts.loadingMore} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">{profilePosts.loadingMore ? "Cargando..." : "Cargar más"}</button> : null}
            </div>
          ) : null}
          {activeTab === "informacion" ? <InfoTab about={about} loading={!about} /> : null}
          {activeTab === "multimedia" ? <MultimediaTab userId={userId} accessToken={accessToken} /> : null}
          {activeTab === "comunidades" ? <CommunitiesTab userId={userId} accessToken={accessToken} isMine={profile.isMine} visible={profile.sectionVisibility.communities} /> : null}
        </div>
      </div>

      {toast ? (
        <div className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>{toast.message}</div>
      ) : null}
    </section>
  );
}

function TodoTab({ profile, about, posts, loadingPosts }: { profile: ProfileData; about: AboutData | null; posts: FeedPost[]; loadingPosts: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-900">Publicaciones recientes</h2>
        {loadingPosts ? <p className="py-4 text-center text-sm text-slate-500">Cargando...</p> : null}
        {!loadingPosts && posts.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Sin publicaciones.</p> : null}
        {posts.slice(0, 3).map((post) => (
          <Link key={post.id} href={`/app?post=${post.id}`} className="mb-2 block rounded-xl border border-slate-200 p-3 hover:border-indigo-200 hover:bg-indigo-50/30">
            <h3 className="font-bold text-slate-900">{post.title || "Publicación"}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.content}</p>
            <p className="mt-1.5 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString("es-PE")}</p>
          </Link>
        ))}
      </div>
      {about && about.interests.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900">Intereses</h2>
          <div className="flex flex-wrap gap-1.5">
            {about.interests.slice(0, 8).map((interest) => <span key={interest.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{interest.value}</span>)}
          </div>
        </div>
      ) : null}
      {profile.academicInfo ? (
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900">Información académica</h2>
          <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
            {profile.academicInfo.university ? <p>Universidad: {profile.academicInfo.university}</p> : null}
            {profile.academicInfo.faculty ? <p>Facultad: {profile.academicInfo.faculty}</p> : null}
            {profile.academicInfo.career ? <p>Carrera: {profile.academicInfo.career}</p> : null}
            {profile.academicInfo.cycle ? <p>Ciclo: {profile.academicInfo.cycle}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoTab({ about, loading }: { about: AboutData | null; loading: boolean }) {
  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Cargando información...</p>;
  if (!about) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Sin información disponible.</p>;

  return (
    <div className="space-y-5">
      {about.education.length > 0 ? (
        <InfoSection title="Formación académica">
          {about.education.map((edu) => (
            <div key={edu.id} className="border-b border-slate-100 pb-2 last:border-0">
              <p className="font-semibold text-slate-900">{edu.institution}</p>
              {edu.program ? <p className="text-sm text-slate-600">{edu.program}</p> : null}
              {edu.degree ? <p className="text-sm text-slate-500">{edu.degree}</p> : null}
              <p className="text-xs text-slate-400">{edu.startYear ?? ""}{edu.isCurrent ? " — Actualidad" : edu.endYear ? ` — ${edu.endYear}` : ""}</p>
            </div>
          ))}
        </InfoSection>
      ) : null}

      {about.employment.length > 0 ? (
        <InfoSection title="Empleo">
          {about.employment.map((emp) => (
            <div key={emp.id} className="border-b border-slate-100 pb-2 last:border-0">
              <p className="font-semibold text-slate-900">{emp.position}</p>
              <p className="text-sm text-slate-600">{emp.company}</p>
              {emp.isCurrent ? <p className="text-xs text-slate-400">Trabajo actual</p> : null}
            </div>
          ))}
        </InfoSection>
      ) : null}

      {about.interests.length > 0 ? (
        <InfoSection title="Intereses">
          <div className="flex flex-wrap gap-1.5">
            {about.interests.map((interest) => <span key={interest.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{interest.category}: {interest.value}</span>)}
          </div>
        </InfoSection>
      ) : null}

      {about.languages.length > 0 ? (
        <InfoSection title="Idiomas">
          <div className="flex flex-wrap gap-2">
            {about.languages.map((lang) => <span key={lang.id} className="text-sm text-slate-700">{lang.name}{lang.level ? ` (${lang.level})` : ""}</span>)}
          </div>
        </InfoSection>
      ) : null}

      {about.links.length > 0 ? (
        <InfoSection title="Enlaces">
          {about.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-indigo-600 hover:underline">{link.label}</a>)}
        </InfoSection>
      ) : null}

      {about.personalInfo.relationshipStatus ? (
        <InfoSection title="Información personal">
          <p className="text-sm text-slate-600">Estado civil: {about.personalInfo.relationshipStatus}</p>
        </InfoSection>
      ) : null}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-2 text-sm font-bold text-slate-900">{title}</h2><div className="rounded-xl border border-slate-200 p-3">{children}</div></div>;
}

function MultimediaTab({ userId, accessToken }: { userId: number; accessToken: string | null }) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const posts = await apiRequest<{ items: any[] }>(`/users/${userId}/posts?limit=30`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        const allMedia = posts.items.flatMap((p: any) => (p.images ?? []).map((img: any) => ({ ...img, postId: p.id, postTitle: p.title, createdAt: p.createdAt })));
        setMedia(allMedia);
      } catch { setMedia([]); }
      finally { setLoading(false); }
    })();
  }, [userId, accessToken]);

  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Cargando multimedia...</p>;
  if (media.length === 0) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay fotos ni videos.</p>;

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {media.map((item) => (
        <Link key={item.id} href={`/app?post=${item.postId}`} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
          <img src={item.imageUrl} alt={item.postTitle} className="h-full w-full object-cover hover:opacity-80" />
        </Link>
      ))}
    </div>
  );
}

function CommunitiesTab({ userId, accessToken, isMine, visible }: { userId: number; accessToken: string | null; isMine: boolean; visible: boolean }) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Use the profile endpoint which returns activeCommunities in the old format
        // or fetch from the user profile
        const data = await apiRequest<any>(`/users/${userId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        setCommunities(data.activeCommunities ?? []);
      } catch { setCommunities([]); }
      finally { setLoading(false); }
    })();
  }, [userId, accessToken]);

  if (!isMine && !visible) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Esta lista es privada.</p>;
  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Cargando comunidades...</p>;
  if (communities.length === 0) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Sin comunidades públicas.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {communities.map((c) => (
        <Link key={c.id} href={`/app/comunidades/${c.id}`} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">{c.name}</Link>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 animate-pulse bg-slate-200 sm:h-52" />
      <div className="px-4 pb-6 sm:px-6">
        <div className="flex items-end gap-4">
          <div className="-mt-16 h-28 w-28 animate-pulse rounded-full border-4 border-white bg-slate-200 sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-2 pb-2">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-5 h-10 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
