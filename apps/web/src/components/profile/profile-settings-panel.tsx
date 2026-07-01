"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Bell, Camera, Lock, UserRound } from "lucide-react";
import { LoginRequiredNotice } from "@/components/auth/login-required-notice";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, mapApiError, API_BASE_URL } from "@/lib/http-client";

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  faculty: string;
  career: string;
  cycle: string;
  username: string;
  headline: string;
  currentCity: string;
  hometown: string;
  gender: string;
  pronouns: string;
  relationshipStatus: string;
};
type PreferenceKey = "emailActivity" | "compactFeed" | "publicAcademicInfo";
type Preferences = Record<PreferenceKey, boolean>;
const EMPTY_FORM: ProfileForm = {
  firstName: "", lastName: "", bio: "", faculty: "", career: "", cycle: "",
  username: "", headline: "", currentCity: "", hometown: "", gender: "", pronouns: "", relationshipStatus: "",
};
const DEFAULT_PREFERENCES: Preferences = { emailActivity: false, compactFeed: false, publicAcademicInfo: true };
const PREFERENCES_KEY = "crunedu_user_preferences";

export function ProfileSettingsPanel() {
  const { accessToken, isAuthenticated, isLoading, refreshUser, user } = useAuth();
  const [tab, setTab] = useState<"profile" | "info" | "notifications" | "privacy">("profile");
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiRequest<Partial<ProfileForm>>("/users/me", { headers: { Authorization: `Bearer ${accessToken}` } });
      setForm({ ...EMPTY_FORM, ...data });
    } catch (error) {
      setMessage({ type: "error", text: mapApiError(error, "No se pudo cargar tu perfil.") });
    } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) void loadProfile(); else setLoading(false);
    try { setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}") }); } catch { setPreferences(DEFAULT_PREFERENCES); }
  }, [isAuthenticated, isLoading, loadProfile]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    try {
      const updated = await apiRequest<Partial<ProfileForm>>("/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(form) });
      setForm((prev) => ({ ...prev, ...updated })); await refreshUser();
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
    } catch (error) { setMessage({ type: "error", text: mapApiError(error, "No se pudo guardar tu perfil.") }); }
    finally { setSaving(false); }
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
      if (!resp.ok) throw new Error("Error");
      await refreshUser();
      setMessage({ type: "success", text: "Avatar actualizado." });
    } catch {
      setMessage({ type: "error", text: "No se pudo subir la imagen." });
    } finally {
      setUploadingAvatar(false);
    }
  }

  function updatePreference(key: PreferenceKey, value: boolean) {
    const next = { ...preferences, [key]: value };
    setPreferences(next); localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    setMessage({ type: "success", text: "Preferencia guardada en este dispositivo." });
  }

  if (isLoading) return <p className="rounded-2xl border bg-white p-4 text-slate-600">Cargando configuración...</p>;
  if (!isAuthenticated) return <LoginRequiredNotice title="Inicia sesión para abrir Configuración." description="Necesitas una sesión activa para cambiar tu cuenta." returnUrl="/app/configuracion-perfil" />;

  const tabs = [
    { id: "profile" as const, label: "Perfil", icon: UserRound },
    { id: "info" as const, label: "Información", icon: Camera },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
    { id: "privacy" as const, label: "Privacidad", icon: Lock },
  ];

  const inputClass = "rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-400 focus:outline-none";

  return <section className="mx-auto max-w-5xl space-y-5">
    <div><h1 className="text-3xl font-black text-slate-950">Configuración</h1><p className="mt-1 text-sm text-slate-600">Controla cómo se ve tu perfil y cómo quieres usar CrunEdu.</p></div>
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <nav className="h-fit rounded-2xl border border-slate-200 bg-white p-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setMessage(null); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${tab === id ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}><Icon size={17} />{label}</button>)}</nav>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {message ? <p className={`mb-5 rounded-xl p-3 text-sm ${message.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p> : null}

        {tab === "profile" ? (
          <form className="space-y-5" onSubmit={saveProfile}>
            <div>
              <h2 className="text-xl font-black">Información del perfil</h2>
              <p className="text-sm text-slate-500">Estos datos ayudan a otros estudiantes a reconocerte.</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : (user?.firstName?.charAt(0) ?? "?")}
              </div>
              <div>
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                  {uploadingAvatar ? "Subiendo..." : "Cambiar avatar"}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ""; }} />
              </div>
            </div>

            <label className="grid gap-1 text-sm font-semibold">Correo<input value={user?.email ?? ""} disabled className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500" /></label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">Nombres<input value={form.firstName} onChange={(e) => setForm((v) => ({ ...v, firstName: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Apellidos<input value={form.lastName} onChange={(e) => setForm((v) => ({ ...v, lastName: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Nombre de usuario<span className="text-xs font-normal text-slate-400">@nombreusuario · 3-30 caracteres · letras, números, . _</span><input value={form.username} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))} placeholder="usuario123" className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Titular<input value={form.headline} onChange={(e) => setForm((v) => ({ ...v, headline: e.target.value }))} placeholder="Estudiante de Educación Matemática" className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Facultad<input value={form.faculty} onChange={(e) => setForm((v) => ({ ...v, faculty: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Carrera<input value={form.career} onChange={(e) => setForm((v) => ({ ...v, career: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Ciclo<input value={form.cycle} onChange={(e) => setForm((v) => ({ ...v, cycle: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Ciudad actual<input value={form.currentCity} onChange={(e) => setForm((v) => ({ ...v, currentCity: e.target.value }))} className={inputClass} /></label>
            </div>

            <label className="grid gap-1 text-sm font-semibold">Biografía<textarea maxLength={240} value={form.bio} onChange={(e) => setForm((v) => ({ ...v, bio: e.target.value }))} className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-400 focus:outline-none" /><span className="text-right text-xs font-normal text-slate-400">{form.bio.length}/240</span></label>

            <button disabled={saving || loading} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Guardando..." : "Guardar cambios"}</button>
          </form>
        ) : null}

        {tab === "info" ? (
          <form className="space-y-5" onSubmit={saveProfile}>
            <div><h2 className="text-xl font-black">Información personal</h2><p className="text-sm text-slate-500">Datos adicionales sobre ti. Algunos son privantes por defecto.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">Ciudad de origen<input value={form.hometown} onChange={(e) => setForm((v) => ({ ...v, hometown: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Género<input value={form.gender} onChange={(e) => setForm((v) => ({ ...v, gender: e.target.value }))} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Pronombres<input value={form.pronouns} onChange={(e) => setForm((v) => ({ ...v, pronouns: e.target.value }))} placeholder="él/ella/elle" className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold">Situación sentimental<input value={form.relationshipStatus} onChange={(e) => setForm((v) => ({ ...v, relationshipStatus: e.target.value }))} className={inputClass} /></label>
            </div>
            <button disabled={saving || loading} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Guardando..." : "Guardar información"}</button>
          </form>
        ) : null}

        {tab === "notifications" ? <PreferenceSection title="Notificaciones" description="Elige cómo enterarte de la actividad de tu cuenta." rows={[{ key: "emailActivity", title: "Resumen de actividad", description: "Permitir futuros resúmenes por correo.", value: preferences.emailActivity }]} onChange={updatePreference} /> : null}
        {tab === "privacy" ? <PreferenceSection title="Privacidad y experiencia" description="Estas preferencias se guardan en este dispositivo." rows={[{ key: "publicAcademicInfo", title: "Mostrar información académica", description: "Permitir que otros vean facultad, carrera y ciclo.", value: preferences.publicAcademicInfo }, { key: "compactFeed", title: "Feed compacto", description: "Preparar una vista con menos espacio entre publicaciones.", value: preferences.compactFeed }]} onChange={updatePreference} /> : null}
      </div>
    </div>
  </section>;
}

function PreferenceSection({ title, description, rows, onChange }: { title: string; description: string; rows: Array<{ key: PreferenceKey; title: string; description: string; value: boolean }>; onChange: (key: PreferenceKey, value: boolean) => void }) {
  return <div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p><div className="mt-5 divide-y divide-slate-100">{rows.map((row) => <label key={row.key} className="flex cursor-pointer items-center justify-between gap-5 py-4"><span><span className="block text-sm font-bold text-slate-900">{row.title}</span><span className="block text-sm text-slate-500">{row.description}</span></span><input type="checkbox" checked={row.value} onChange={(event) => onChange(row.key, event.target.checked)} className="h-5 w-5 accent-indigo-600" /></label>)}</div></div>;
}
