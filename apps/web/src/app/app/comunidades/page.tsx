"use client";

import { CommunityCard } from "@/components/community-card";
import { useCommunities } from "@/hooks/useCommunities";

export default function Page() {
  const { communities, loading, error } = useCommunities();

  if (loading) {
    return (
      <section>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-3xl font-black tracking-tight">Comunidades</h1>
          <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-3xl font-black tracking-tight">Comunidades</h1>
          <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
        </div>
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">Error: {error}</p>
          <p className="mt-2 text-sm text-red-600">Intenta recargar la página.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Comunidades</h1>
        <p className="mt-2 text-slate-600">Espacios por carrera, facultad, curso, trámite o tema.</p>
      </div>
      {communities.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-bold text-slate-700">No hay comunidades aún</p>
          <p className="mt-2 text-sm text-slate-500">Pronto se crearán las primeras comunidades.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </section>
  );
}