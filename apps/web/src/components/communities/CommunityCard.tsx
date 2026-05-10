import { Users, NotebookText } from "lucide-react";
import Link from "next/link";
import type { CommunityViewModel } from "./types";

const categoryStyles = {
  carreras: "bg-sky-100 text-sky-700",
  cursos: "bg-indigo-100 text-indigo-700",
  tramites: "bg-amber-100 text-amber-700",
  debates: "bg-violet-100 text-violet-700",
  oportunidades: "bg-emerald-100 text-emerald-700",
  investigacion: "bg-cyan-100 text-cyan-700",
  general: "bg-slate-100 text-slate-700",
};

export function CommunityCard({ community, onJoin }: { community: CommunityViewModel; onJoin: (community: CommunityViewModel, event?: React.MouseEvent<HTMLButtonElement>) => void }) {
  const status = community.isRecommended ? "Recomendada" : community.isNew ? "Nueva" : community.isActive ? "Activa ahora" : null;
  const actionLabel = community.isPrivate ? "Solicitar acceso" : community.isMember ? "Ver comunidad" : "Unirse";
  const bannerClass = `h-24 ${bannerForCategory(community.category)}`;
  return <Link href={`/app/comunidades/${community.id}`} className="group block h-full"><article className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-medium"><div className={bannerClass}>{status ? <span className="m-3 inline-flex rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">{status}</span> : null}</div><div className="-mt-6 p-4"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-indigo-600 text-xl text-white">{community.name.charAt(0).toUpperCase()}</div><h3 className="text-lg font-bold text-slate-950">{community.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-600">{community.description ?? "Comunidad académica para compartir y aprender."}</p><div className="mt-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${categoryStyles[community.category]}`}>{community.category}</span></div><div className="mt-3 flex items-center gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{formatCount(community.memberCount)} miembros</span><span className="inline-flex items-center gap-1"><NotebookText className="h-3.5 w-3.5" />{formatCount(community.postCount)} publicaciones</span></div><div className="mt-4">{community.isMember ? <span className="inline-flex w-full justify-center rounded-xl border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700">{actionLabel}</span> : <button className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" onClick={(event) => onJoin(community, event)}>{actionLabel}</button>}</div></div></article></Link>;
}
function formatCount(value: number) { return new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0); }
function bannerForCategory(category: CommunityViewModel["category"]) { switch (category) { case "carreras": return "bg-gradient-to-r from-sky-700 to-indigo-600"; case "cursos": return "bg-gradient-to-r from-indigo-700 to-violet-600"; case "tramites": return "bg-gradient-to-r from-amber-500 to-orange-500"; case "debates": return "bg-gradient-to-r from-violet-700 to-fuchsia-600"; case "oportunidades": return "bg-gradient-to-r from-emerald-600 to-lime-500"; case "investigacion": return "bg-gradient-to-r from-cyan-700 to-blue-600"; default: return "bg-gradient-to-r from-slate-600 to-slate-500"; }}
