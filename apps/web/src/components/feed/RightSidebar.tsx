import type { Community } from "@crunedu/shared";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card } from "@/components/ui";

function communityInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "C";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

export function RightSidebar({ communities, trends, draftsCount, onOpenCreate }: { communities: Community[]; trends: string[]; draftsCount: number; onJoin: () => void; onOpenCreate: (type: "publicacion" | "debate") => void }) {
  return <div className="space-y-3">
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-950">Comunidades recomendadas</h3>
          <p className="text-xs text-slate-500">Espacios reales para participar.</p>
        </div>
        <Link href="/app/comunidades" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">Ver <ArrowRight className="h-3 w-3" /></Link>
      </div>
      {communities.length ? communities.slice(0, 4).map((community) => {
        const members = community.membersCount ?? 0;
        const posts = community.postsCount ?? 0;
        return <div key={community.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/40">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700 ring-1 ring-indigo-100">
            {community.avatarUrl ? <img src={community.avatarUrl} alt={community.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center">{communityInitial(community.name)}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{community.name}</p>
            <p className="line-clamp-1 text-xs text-slate-500">{community.description || "Comunidad estudiantil"}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"><Users className="h-3 w-3" />{formatCount(members)} miembros · {formatCount(posts)} publicaciones</p>
          </div>
          <Link href={`/app/comunidades/${community.id}`} className="shrink-0 rounded-full border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-white">Ver</Link>
        </div>;
      }) : <p className="text-xs text-slate-500">Aún no hay comunidades para mostrar.</p>}
    </Card>
    <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Temas en tendencia</h3>{trends.length ? <div className="flex flex-wrap gap-1">{trends.map((trend) => <span key={trend} className="rounded-full bg-slate-100 px-2 py-1 text-xs">#{trend}</span>)}</div> : <p className="text-xs text-slate-500">Las tendencias aparecerán cuando haya más publicaciones.</p>}<button onClick={() => onOpenCreate("debate")} className="text-xs font-semibold text-indigo-700">Crear tema</button></Card>
    <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Actividad reciente</h3><p className="text-xs text-slate-500">Aún no hay actividad reciente.</p><p className="text-xs text-slate-500">Publica o comenta para activar tu comunidad.</p></Card>
    {draftsCount > 0 ? <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Borradores</h3><p className="text-xs text-slate-600">Tienes {draftsCount} borradores guardados.</p><button className="text-xs font-semibold text-indigo-700">Ver borradores</button></Card> : null}
  </div>;
}
