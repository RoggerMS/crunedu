"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  faculty: string;
  career: string;
  cycle: string;
};

type SocialProfile = {
  id: number;
  fullName: string;
  academicInfo: { faculty: string | null; career: string | null; cycle: string | null };
  activeCommunities: Array<{ id: number; name: string; slug: string }>;
  recentPosts: Array<{ id: number; title: string; content: string; createdAt: string; community: { id: number; name: string } | null }>;
  activitySummary: { recentContributions: Array<{ type: string; id: number; title: string; createdAt: string }> };
  reputation: { usefulContributions: number; answersGiven: number };
  relationship: { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean };
};

type SocialUser = {
  id: number;
  fullName: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
};

const EMPTY_FORM: ProfileForm = { firstName: "", lastName: "", bio: "", faculty: "", career: "", cycle: "" };

export default function PerfilPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [targetUserId, setTargetUserId] = useState("2");
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { if (isAuthenticated) loadProfile(); else setLoading(false); }, [isAuthenticated, accessToken]);

  async function loadProfile() {
    try {
      const data = await apiRequest<ProfileForm>("/users/me", { headers: { Authorization: `Bearer ${accessToken}` } });
      setForm({ ...EMPTY_FORM, ...data });
    } catch {
      // Preserve current behavior: if profile cannot be loaded, keep empty form.
    } finally {
      setLoading(false);
    }
  }

  async function loadSocialProfile() {
    if (!targetUserId) return;
    setSocialLoading(true);
    setError(null);
    try {
      const profile = await apiRequest<SocialProfile>(`/users/${targetUserId}`);
      setSocialProfile(profile);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar el perfil público."));
    } finally { setSocialLoading(false); }
  }

  async function loadFriends() {
    if (!targetUserId) return;
    setFriendsLoading(true);
    try {
      const data = await apiRequest<SocialUser[]>(`/users/${targetUserId}/friends`);
      setFriends(data);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar la lista de amigos."));
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }

  async function toggleFollow() {
    if (!isAuthenticated || !socialProfile) return;
    const method = socialProfile.relationship.isFollowing ? "DELETE" : "POST";
    const relation = await apiRequest<SocialProfile["relationship"]>(`/follows/${socialProfile.id}`, { method, headers: { Authorization: `Bearer ${accessToken}` } });
    setSocialProfile({ ...socialProfile, relationship: relation });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null); setSuccess(null);
    try {
      const profile = await apiRequest<ProfileForm>("/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(form) });
      setForm({ ...EMPTY_FORM, ...profile });
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) { setError(mapApiError(err, "No se pudo guardar tu perfil.")); }
    finally { setSaving(false); }
  }

  if (!isAuthenticated) return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Inicia sesión para editar tu perfil.</p>;

  return (<section className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
    <div>
      <h1 className="text-2xl font-black">Mi perfil</h1>
      <p className="mt-1 text-sm text-slate-600">Completa tus datos básicos para que tu nombre aparezca en publicaciones.</p>
    </div>
    {loading ? <p className="text-slate-600">Cargando perfil...</p> : null}
    {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    {success ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

    <form className="grid gap-4" onSubmit={handleSubmit}>{([ ["firstName", "Nombres"], ["lastName", "Apellidos"], ["faculty", "Facultad"], ["career", "Carrera"], ["cycle", "Ciclo"], ] as const).map(([field, label]) => (<label key={field} className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input className="rounded-2xl border border-slate-200 px-4 py-2" value={form[field]} onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))} /></label>))}
      <label className="grid gap-1 text-sm font-semibold text-slate-700">Biografía<textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-2" value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} /></label>
      <button type="submit" disabled={saving || loading} className="mt-2 w-fit rounded-2xl bg-indigo-600 px-5 py-2 font-semibold text-white">{saving ? "Guardando..." : "Guardar cambios"}</button>
    </form>

    <div className="rounded-2xl border border-slate-200 p-4">
      <h2 className="text-lg font-bold">Relación social</h2>
      <p className="text-sm text-slate-600">Ingresa un ID de usuario para seguir o dejar de seguir.</p>
      <div className="mt-3 flex gap-2"><input className="rounded-xl border border-slate-200 px-3 py-2" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} /><button onClick={loadSocialProfile} className="rounded-xl bg-slate-900 px-3 py-2 text-white">Ver perfil</button><button onClick={loadFriends} className="rounded-xl bg-emerald-700 px-3 py-2 text-white">Ver amigos</button></div>
      {socialLoading ? <p className="mt-2 text-sm">Cargando...</p> : null}
      {socialProfile ? <div className="mt-3 space-y-3"><div className="flex items-center gap-3"><p className="font-semibold">{socialProfile.fullName}</p>{socialProfile.relationship.isFriend ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Amistad mutua</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Sin amistad mutua</span>}<button onClick={toggleFollow} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">{socialProfile.relationship.isFollowing ? "Dejar de seguir" : "Seguir"}</button></div><p className="text-sm text-slate-600">Facultad: {socialProfile.academicInfo.faculty || "No disponible"} · Carrera: {socialProfile.academicInfo.career || "No disponible"} · Ciclo: {socialProfile.academicInfo.cycle || "No disponible"}</p><div><h3 className="font-semibold">Comunidades activas</h3><ul className="mt-2 flex flex-wrap gap-2">{socialProfile.activeCommunities.length ? socialProfile.activeCommunities.map((community) => <li key={community.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{community.name}</li>) : <li className="text-sm text-slate-600">Sin comunidades activas registradas.</li>}</ul></div><div><h3 className="font-semibold">Publicaciones recientes</h3><ul className="mt-2 space-y-2">{socialProfile.recentPosts.length ? socialProfile.recentPosts.map((post) => <li key={post.id} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold">{post.title || "Sin título"}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString("es-PE")} · {post.community?.name || "Comunidad no especificada"}</p></li>) : <li className="text-sm text-slate-600">No hay publicaciones recientes.</li>}</ul></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><h3 className="font-semibold">Resumen de actividad</h3><p className="mt-1 text-sm text-slate-700">Aportes útiles: {socialProfile.reputation.usefulContributions} · Respuestas dadas: {socialProfile.reputation.answersGiven}</p><p className="mt-1 text-xs text-slate-600">Últimos aportes: {socialProfile.activitySummary.recentContributions.length}</p></div></div> : null}
      <div className="mt-4 rounded-2xl border border-slate-100 p-3">
        <h3 className="font-semibold">Amigos</h3>
        {friendsLoading ? <p className="mt-2 text-sm text-slate-600">Cargando amigos...</p> : null}
        {!friendsLoading && friends.length === 0 ? <p className="mt-2 text-sm text-slate-600">No hay amigos mutuos para este perfil.</p> : null}
        <ul className="mt-2 space-y-2">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-sm font-medium">{friend.fullName}</span>
              {friend.isFriend ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Amigos</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>);
}
