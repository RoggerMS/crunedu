"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState, PrimaryButton } from "@/components/ui";
import { apiRequest, mapApiError } from "@/lib/api-helpers";
import { useAccessToken } from "@/hooks/useAccessToken";

type Community = { id: number; name: string };

function parseRole(token: string | null) {
  try {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? null;
  } catch {
    return null;
  }
}

export default function NewAdminProcedurePage() {
  const { accessToken } = useAccessToken();
  const role = useMemo(() => parseRole(accessToken), [accessToken]);
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunity() {
      const data = await apiRequest<Community[]>("/communities");
      const target = data.find((community) => community.name.toLowerCase() === "trámites");
      setCommunityId(target?.id ?? null);
    }
    void loadCommunity();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !communityId) return;
    try {
      setLoading(true);
      setMessage(null);
      await apiRequest("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), communityId }),
      });
      setTitle("");
      setContent("");
      setMessage("Trámite publicado correctamente.");
    } catch (err) {
      setMessage(mapApiError(err, "No se pudo publicar el trámite."));
    } finally {
      setLoading(false);
    }
  }

  if (role !== "ADMIN") return <PageState type="error" title="Acceso restringido" description="Solo administradores pueden publicar trámites." />;

  return (
    <section className="space-y-5">
      <ModuleHeader title="Nuevo trámite" description="Publica información oficial para estudiantes desde el panel de administración." />
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Título del trámite" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-40 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contenido libre del trámite" />
        <PrimaryButton type="submit" disabled={loading || !communityId}>{loading ? "Publicando..." : "Publicar trámite"}</PrimaryButton>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </form>
    </section>
  );
}
