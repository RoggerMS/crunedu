"use client";

import { CommunityCard } from "@/components/community-card";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { useEffect, useState } from "react";

export default function Page() {
  const { communities, loading, error } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRecommended() {
      if (!isAuthenticated) return;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
      const response = await fetch(`${apiBaseUrl}/communities/recommended`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) setRecommended(await response.json());
    }
    fetchRecommended();
  }, [isAuthenticated, accessToken]);

  if (loading) return <section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Cargando comunidades...</p></section>;
  if (error) return <section className="rounded-2xl border border-red-200 bg-white p-5"><p className="text-sm text-red-700">Error: {error}</p></section>;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Comunidades</h1>
        <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
      </div>

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
