"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
  isFollowing: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { if (isAuthenticated) loadProfile(); else setLoading(false); }, [isAuthenticated, accessToken]);

  async function loadProfile() {
    const response = await fetch(`${apiBaseUrl}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return setLoading(false);
    const data = (await response.json()) as ProfileForm;
    setForm({ ...EMPTY_FORM, ...data });
    setLoading(false);
  }

  async function loadSocialProfile() {
    if (!targetUserId) return;
    setSocialLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/users/${targetUserId}`);
      if (!response.ok) throw new Error("No se pudo cargar el perfil público.");
      setSocialProfile((await response.json()) as SocialProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally { setSocialLoading(false); }
  }

  async function toggleFollow() {
    if (!isAuthenticated || !socialProfile) return;
    const method = socialProfile.isFollowing ? "DELETE" : "POST";
    const response = await fetch(`${apiBaseUrl}/follows/${socialProfile.id}`, { method, headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error("No se pudo actualizar seguimiento.");
    const relation = (await response.json()) as Pick<SocialProfile, "isFollowing" | "isFriend">;
    setSocialProfile({ ...socialProfile, ...relation });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`${apiBaseUrl}/users/me`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error("No se pudo guardar tu perfil.");
      setForm({ ...EMPTY_FORM, ...((await response.json()) as ProfileForm) });
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) { setError(err instanceof Error ? err.message : "Ocurrió un error inesperado."); }
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
      <div className="mt-3 flex gap-2"><input className="rounded-xl border border-slate-200 px-3 py-2" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} /><button onClick={loadSocialProfile} className="rounded-xl bg-slate-900 px-3 py-2 text-white">Ver perfil</button></div>
      {socialLoading ? <p className="mt-2 text-sm">Cargando...</p> : null}
      {socialProfile ? <div className="mt-3 flex items-center gap-3"><p className="font-semibold">{socialProfile.fullName}</p>{socialProfile.isFriend ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Amigos</span> : null}<button onClick={toggleFollow} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">{socialProfile.isFollowing ? "Dejar de seguir" : "Seguir"}</button></div> : null}
    </div>
  </section>);
}
