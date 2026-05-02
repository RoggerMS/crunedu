"use client";

import { CommunityCard } from "@/components/community-card";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { FormEvent, useEffect, useState } from "react";
import { mapApiError } from "@/lib/http-client";
import { createCommunity, getRecommendedCommunities } from "@/lib/api-helpers";
import { Input, PageState, PrimaryButton, TextArea } from "@/components/ui";

export default function Page() {
  const { communities, loading, error, reload } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rules: "", avatarUrl: "", coverUrl: "" });

  async function handleCreateCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated || !accessToken) {
      setFormError("Inicia sesión para crear una comunidad.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createCommunity({
        name: form.name,
        description: form.description || undefined,
        rules: form.rules || undefined,
        avatarUrl: form.avatarUrl || undefined,
        coverUrl: form.coverUrl || undefined,
      }, accessToken);
      setForm({ name: "", description: "", rules: "", avatarUrl: "", coverUrl: "" });
      setIsCreateOpen(false);
      await reload();
    } catch (error) {
      setFormError(mapApiError(error, "No se pudo crear la comunidad."));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function fetchRecommended() {
      if (!isAuthenticated) return;
      const data = await getRecommendedCommunities(accessToken ?? "");
      setRecommended(data);
    }
    fetchRecommended().catch((err) => setRecommendedError(mapApiError(err, "No se pudieron cargar las comunidades recomendadas.")));
  }, [isAuthenticated, accessToken]);

  if (loading) {
    return <PageState type="loading" title="Cargando comunidades" description="Estamos preparando tus comunidades disponibles." />;
  }
  if (error) {
    return (
      <PageState
        type="error"
        title="No pudimos cargar las comunidades"
        description={error}
        action={<PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Comunidades</h1>
        <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
        <PrimaryButton type="button" className="mt-4" onClick={() => setIsCreateOpen((prev) => !prev)}>Crear comunidad</PrimaryButton>
        {isCreateOpen && (
          <form className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreateCommunity}>
            <Input placeholder="Nombre de la comunidad" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required minLength={3} maxLength={80} />
            <TextArea placeholder="Descripción (opcional)" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} maxLength={300} rows={3} />
            <TextArea placeholder="Reglas iniciales (opcional)" value={form.rules} onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))} maxLength={500} rows={3} />
            <Input type="url" placeholder="URL de imagen de perfil (opcional)" value={form.avatarUrl} onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))} />
            <Input type="url" placeholder="URL de portada (opcional)" value={form.coverUrl} onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))} />
            {formError ? <p className="whitespace-pre-wrap text-sm text-red-700">{formError}</p> : null}
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={isSubmitting}>{isSubmitting ? "Creando..." : "Crear comunidad"}</PrimaryButton>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {recommendedError ? <p className="text-sm text-red-700">{recommendedError}</p> : null}
      {recommended.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-lg font-bold text-indigo-900">Comunidades recomendadas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((community) => <CommunityCard key={`recommended-${community.id}`} community={community} />)}
          </div>
        </div>
      )}

      {communities.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Aún no hay comunidades creadas. Puedes crear la primera.</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{communities.map((community) => <CommunityCard key={community.id} community={community} />)}</div>}
    </section>
  );
}
