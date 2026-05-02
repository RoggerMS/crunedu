"use client";

import { CommunityCard } from "@/components/community-card";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { useEffect, useState } from "react";
import { mapApiError } from "@/lib/http-client";
import { getRecommendedCommunities } from "@/lib/api-helpers";
import { PageState, PrimaryButton } from "@/components/ui";

const mockCluneduCommunity = {
  id: 999999,
  name: "ClunEDU",
  description:
    "Comunidad de muestra para validar diseño visual antes de publicar cambios reales.",
  rules: null,
  avatarUrl:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80",
  coverUrl:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  membersCount: 124,
  postsCount: 18,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function Page() {
  const { communities, loading, error, reload } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchRecommended() {
      if (!isAuthenticated) return;
      const data = await getRecommendedCommunities(accessToken ?? "");
      setRecommended(data);
    }
    fetchRecommended().catch((err) =>
      setRecommendedError(
        mapApiError(err, "No se pudieron cargar las comunidades recomendadas."),
      ),
    );
  }, [isAuthenticated, accessToken]);

  if (loading) {
    return (
      <PageState
        type="loading"
        title="Cargando comunidades"
        description="Estamos preparando tus comunidades disponibles."
      />
    );
  }
  if (error) {
    return (
      <PageState
        type="error"
        title="No pudimos cargar las comunidades"
        description={error}
        action={
          <PrimaryButton type="button" onClick={() => void reload()}>
            Reintentar
          </PrimaryButton>
        }
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Comunidades</h1>
        <p className="mt-2 text-slate-600">
          Espacios por carrera, facultad, curso, trámite o tema.
        </p>
        <a
          href="/app/comunidades/nueva"
          className="mt-4 inline-flex rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Crear comunidad
        </a>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-bold text-emerald-900">
          Vista previa visual (borrable)
        </h2>
        <p className="mt-1 text-sm text-emerald-800">
          Esta tarjeta es solo de demostración en código y no se guarda en la
          base de datos.
        </p>
        <div className="mt-4 max-w-sm">
          <CommunityCard
            community={mockCluneduCommunity as any}
            href="/app/comunidades/demo-clunedu"
          />
        </div>
      </div>

      {recommendedError ? (
        <p className="text-sm text-red-700">{recommendedError}</p>
      ) : null}
      {recommended.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <h2 className="text-lg font-bold text-indigo-900">
            Comunidades recomendadas
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((community) => (
              <CommunityCard
                key={`recommended-${community.id}`}
                community={community}
              />
            ))}
          </div>
        </div>
      )}

      {communities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Aún no hay comunidades creadas. Puedes crear la primera.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </section>
  );
}
