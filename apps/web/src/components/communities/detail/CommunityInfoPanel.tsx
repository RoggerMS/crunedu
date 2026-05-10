import type { CommunityDetailModel } from "./types";

export function CommunityInfoPanel({ community }: { community: CommunityDetailModel }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Información</h2><dl className="mt-3 grid gap-2 text-sm"><div><dt className="font-semibold text-slate-900">Descripción</dt><dd className="text-slate-600">{community.description}</dd></div><div><dt className="font-semibold text-slate-900">Privacidad</dt><dd className="text-slate-600">{community.visibilityLabel}</dd></div><div><dt className="font-semibold text-slate-900">Creación</dt><dd className="text-slate-600">{community.createdAt ?? "No disponible"}</dd></div><div><dt className="font-semibold text-slate-900">Categoría</dt><dd className="text-slate-600">{community.category ?? "General"}</dd></div></dl></section>;
}
