import { MoreHorizontal, Share2 } from "lucide-react";
import type { CommunityDetailModel } from "./types";

type Props = {
  community: CommunityDetailModel;
  isCreator: boolean;
  isMember: boolean;
  joining: boolean;
  onJoin: () => void;
  onShare: () => void;
  onMenu: () => void;
};

export function CommunityHero({ community, isCreator, isMember, joining, onJoin, onShare, onMenu }: Props) {
  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"><div className="h-40 bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">{community.coverUrl ? <img src={community.coverUrl} alt={`Portada de ${community.name}`} className="h-full w-full object-cover" /> : null}</div><div className="-mt-8 px-6 pb-6"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-black text-indigo-700">{community.avatarUrl ? <img src={community.avatarUrl} alt={community.name} className="h-full w-full rounded-xl object-cover" /> : community.name.charAt(0).toUpperCase()}</div><div className="mt-4 flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-950">{community.name}</h1><p className="mt-1 text-slate-600">{community.description}</p><p className="mt-2 text-sm text-slate-500">Reglas: {community.rules[0]}</p><p className="mt-1 text-xs text-slate-500">Creada el {community.createdAt ?? "fecha no disponible"} • {community.visibilityLabel} • {community.membersCount} miembros</p></div><div className="flex flex-wrap items-center gap-2">{isCreator ? <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Eres creador de esta comunidad</span> : isMember ? <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">Miembro</span> : <button onClick={onJoin} disabled={joining} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{joining ? "Uniéndote..." : "Unirse"}</button>}<button onClick={onShare} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"><Share2 className="h-4 w-4" />Compartir</button><button onClick={onMenu} className="rounded-xl border border-slate-300 px-3 py-2 text-slate-700"><MoreHorizontal className="h-4 w-4" /></button></div></div></div></article>;
}
