import type { Community } from "@crunedu/shared";
import { Card } from "@/components/ui";

export function RightSidebar({ communities, trends, draftsCount, onJoin }: { communities: Community[]; trends: string[]; draftsCount: number; onJoin: () => void }) {
  return <aside className="space-y-3 xl:col-span-4">
    <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Comunidades recomendadas</h3>{communities.slice(0, 4).map((community) => <div key={community.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"><p className="text-sm">{community.name}</p><button onClick={onJoin} className="rounded-full border px-2 py-1 text-xs">Unirse</button></div>)}</Card>
    <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Temas en tendencia</h3>{trends.length ? <div className="flex flex-wrap gap-1">{trends.map((trend) => <span key={trend} className="rounded-full bg-slate-100 px-2 py-1 text-xs">#{trend}</span>)}</div> : <p className="text-xs text-slate-500">Aún no hay tendencias.</p>}</Card>
    <Card className="space-y-2 p-4"><h3 className="text-sm font-black">Actividad reciente</h3><p className="text-xs text-slate-500">La actividad reciente aparecerá cuando haya interacción.</p>{draftsCount > 0 ? <p className="text-xs font-semibold text-indigo-700">Tienes {draftsCount} borradores guardados.</p> : null}</Card>
  </aside>;
}
