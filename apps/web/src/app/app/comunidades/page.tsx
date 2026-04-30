"use client";

import { CommunityCard } from "@/components/community-card";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { useEffect, useState } from "react";
import { buildApiUrl, mapApiError } from "@/lib/api";
import { PageState, PrimaryButton } from "@/components/ui";

export default function Page() {
  const { communities, loading, error, reload } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommended() {
      if (!isAuthenticated) return;
      const response = await fetch(buildApiUrl("/communities/recommended"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        setRecommended(await response.json());
        return;
      }
      setRecommendedError("No se pudieron cargar las comunidades recomendadas.");
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
        action={<PrimaryButton type="button" onClick={() => void reload()}>Volver a cargar</PrimaryButton>}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Comunidades</h1>
        <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => <CommunityCard key={community.id} community={community} />)}
      </div>
    </section>
  );
}
