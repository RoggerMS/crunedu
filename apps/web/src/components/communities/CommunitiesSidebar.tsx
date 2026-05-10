import type { CommunityCategory, CommunityViewModel } from "./types";

const POPULAR_CATEGORIES: { label: string; category: CommunityCategory }[] = [
  { label: "Ciencias", category: "carreras" },
  { label: "Tecnología", category: "cursos" },
  { label: "Académico", category: "debates" },
  { label: "Investigación", category: "investigacion" },
  { label: "Trámites", category: "tramites" },
  { label: "Oportunidades", category: "oportunidades" },
];

export function CommunitiesSidebar({ communities, onJoin, onCategoryFilter }: { communities: CommunityViewModel[]; onJoin: (community: CommunityViewModel) => void; onCategoryFilter: (category: CommunityCategory) => void; }) {
  const recommended = communities.filter((community) => !community.isMember).sort((a, b) => b.memberCount - a.memberCount).slice(0, 3);
  const trends = communities.sort((a, b) => b.postCount - a.postCount).slice(0, 5);

  return <aside className="space-y-4"><Card title="Tendencias">{trends.length === 0 ? <p className="text-sm text-slate-500">Las tendencias aparecerán cuando haya más actividad.</p> : <ul className="space-y-2">{trends.map((trend, index) => <li key={trend.id} className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold text-slate-500">{index + 1}</span><span className="flex-1 text-slate-700">{trend.name}</span><span className="text-xs text-slate-500">{trend.postCount} publicaciones</span></li>)}</ul>}<button className="mt-3 text-sm font-semibold text-indigo-600">Ver todas las tendencias</button></Card><Card title="Recomendado para ti">{recommended.length === 0 ? <p className="text-sm text-slate-500">Te mostraremos recomendaciones cuando haya más comunidades.</p> : <div className="space-y-3">{recommended.map((community) => <div key={`rec-${community.id}`} className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-indigo-600" /><div className="flex-1"><p className="text-sm font-semibold text-slate-800">{community.name}</p><p className="text-xs text-slate-500">{community.memberCount} miembros</p></div><button className="rounded-lg border border-indigo-600 px-2 py-1 text-xs font-semibold text-indigo-700" onClick={() => onJoin(community)}>Unirse</button></div>)}</div>}<button className="mt-3 text-sm font-semibold text-indigo-600">Ver todas</button></Card><Card title="Actividad reciente"><p className="text-sm text-slate-500">La actividad aparecerá cuando haya publicaciones, respuestas o nuevos miembros.</p></Card><Card title="Categorías populares"><div className="flex flex-wrap gap-2">{POPULAR_CATEGORIES.map((item) => <button key={item.label} onClick={() => onCategoryFilter(item.category)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{item.label}</button>)}</div></Card></aside>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><h3 className="text-lg font-bold text-slate-900">{title}</h3><div className="mt-3">{children}</div></section>;
}
