import { Flame, MessageSquare, ShieldCheck } from "lucide-react";
import type { MomentNewsSummary } from "./types";
import { MomentNewsCard } from "./MomentNewsCard";

export function MomentsNewsView({
  news,
  onOpenMoments,
}: {
  news: MomentNewsSummary[];
  onOpenMoments: (relatedId: string) => void;
}) {
  const mostBoosted = [...news].sort((a, b) => b.stats.boosts - a.stats.boosts).slice(0, 3);
  const alerts = news.filter((n) => n.tags.some((t) => /aviso|alerta|sistema/i.test(t)));

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Noticias del campus</h1>
        <p className="text-slate-600">Resumen de lo más relevante que está pasando.</p>

        {news.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
            <p className="text-slate-600">No hay noticias del campus todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((n) => <MomentNewsCard key={n.id} item={n} onOpenMoments={() => onOpenMoments(n.relatedMomentIds[0] ?? "")} />)}
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Lo más impulsado</h3>
          {mostBoosted.length === 0 ? <p className="mt-1 text-sm text-slate-600">Sin datos aún.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {mostBoosted.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><span className="truncate">{n.title}</span><span className="inline-flex items-center gap-1 text-slate-500"><Flame className="h-3.5 w-3.5" />{n.stats.boosts}</span></li>)}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Alertas y avisos</h3>
          {alerts.length === 0 ? <p className="mt-1 text-sm text-slate-600">No hay alertas activas.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {alerts.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><span className="truncate">{n.title}</span><span className="inline-flex items-center gap-1 text-amber-600"><ShieldCheck className="h-3.5 w-3.5" />{n.stats.confirmations}</span></li>)}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Resumen</h3>
          <p className="mt-1 text-sm text-slate-600"><MessageSquare className="mr-1 inline h-3.5 w-3.5" />{news.reduce((a, n) => a + n.stats.comments, 0)} comentarios en noticias</p>
        </div>
      </aside>
    </section>
  );
}
