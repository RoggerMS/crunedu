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

const EMPTY_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  bio: "",
  faculty: "",
  career: "",
  cycle: "",
};

export default function PerfilPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      try {
        setError(null);
        const response = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar tu perfil.");
        }

        const data = (await response.json()) as ProfileForm;
        setForm({ ...EMPTY_FORM, ...data });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [accessToken, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${apiBaseUrl}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message ?? "No se pudo guardar tu perfil.";
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      const data = (await response.json()) as ProfileForm;
      setForm({ ...EMPTY_FORM, ...data });
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Inicia sesión para editar tu perfil.</p>;
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-black">Mi perfil</h1>
      <p className="mt-1 text-sm text-slate-600">Completa tus datos básicos para que tu nombre aparezca en publicaciones.</p>

      {loading ? <p className="mt-4 text-slate-600">Cargando perfil...</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {([
          ["firstName", "Nombres"],
          ["lastName", "Apellidos"],
          ["faculty", "Facultad"],
          ["career", "Carrera"],
          ["cycle", "Ciclo"],
        ] as const).map(([field, label]) => (
          <label key={field} className="grid gap-1 text-sm font-semibold text-slate-700">
            {label}
            <input
              className="rounded-2xl border border-slate-200 px-4 py-2 outline-none ring-indigo-200 focus:ring"
              value={form[field]}
              onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
            />
          </label>
        ))}

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Biografía
          <textarea
            className="min-h-28 rounded-2xl border border-slate-200 px-4 py-2 outline-none ring-indigo-200 focus:ring"
            value={form.bio}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
          />
        </label>

        <button
          type="submit"
          disabled={saving || loading}
          className="mt-2 w-fit rounded-2xl bg-indigo-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}
