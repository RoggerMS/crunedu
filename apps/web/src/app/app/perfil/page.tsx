"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest } from "@/lib/http-client";

type ProfileData = {
  firstName: string;
  lastName: string;
  bio: string;
  faculty: string;
  career: string;
  cycle: string;
};

const MODULE_LINKS = [
  { label: "Inicio", href: "/app" },
  { label: "Comunidades", href: "/app/comunidades" },
  { label: "Debates y conversaciones", href: "/app/conversar?tab=debates" },
  { label: "Preguntas", href: "/app/preguntas" },
  { label: "Apuntes", href: "/app/apuntes" },
  { label: "Trámites", href: "/app/tramites" },
  { label: "Momentos", href: "/app/momentos" },
  { label: "Tienda", href: "/app/tienda" },
] as const;

export default function MiPerfilPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<ProfileData>("/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProfile(data);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [accessToken, isAuthenticated]);

  const displayName = useMemo(() => {
    if (!profile) return "Mi usuario";
    const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    return fullName || "Mi usuario";
  }, [profile]);

  if (!isAuthenticated) {
    return <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Inicia sesión para ver tu perfil.</p>;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="relative h-40 bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500">
        <button
          type="button"
          aria-label="Cambiar portada"
          className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
        >
          📷 Portada
        </button>
      </div>
      <div className="relative px-6 pb-6">
        <div className="relative -mt-14 h-28 w-28">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-3xl font-black text-indigo-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            aria-label="Cambiar foto de perfil"
            className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
          >
            📷
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">@mi_usuario</p>
            <h1 className="text-3xl font-black text-slate-900">{loading ? "Cargando perfil..." : displayName}</h1>
          </div>
          <Link href="/app/configuracion-perfil" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Editar perfil
          </Link>
        </div>

        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {profile?.bio?.trim() || "Agrega una biografía desde Configuración de perfil para que otras personas sepan más de ti."}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Facultad</p>
            <p className="font-semibold text-slate-800">{profile?.faculty || "Sin registrar"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Carrera</p>
            <p className="font-semibold text-slate-800">{profile?.career || "Sin registrar"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Ciclo</p>
            <p className="font-semibold text-slate-800">{profile?.cycle || "Sin registrar"}</p>
          </article>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <h2 className="text-lg font-bold text-slate-900">Mi actividad en CrunEdu</h2>
          <p className="mt-1 text-sm text-slate-600">Accesos rápidos para construir tu perfil con publicaciones, debates y conversaciones.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MODULE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
