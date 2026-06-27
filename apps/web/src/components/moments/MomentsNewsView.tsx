import { Flame, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";
import type { MomentNewsSummary } from "./types";
import { MomentNewsCard } from "./MomentNewsCard";

export function MomentsNewsView({ news }: { news: MomentNewsSummary[] }) {
  const mostLiked = [...news].sort((a, b) => b.stats.likes - a.stats.likes).slice(0, 3);
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
            {news.map((n) => (
              <Link key={n.id} href={`/app/momentos/noticias/${n.id}`} className="block">
                <MomentNewsCard item={n} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Lo más gustado</h3>
          {mostLiked.length === 0 ? <p className="mt-1 text-sm text-slate-600">Sin datos aún.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {mostLiked.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2">
                  <Link href={`/app/momentos/noticias/${n.id}`} className="truncate hover:text-indigo-600">{n.title}</Link>
                  <span className="inline-flex items-center gap-1 text-slate-500"><Flame className="h-3.5 w-3.5" />{n.stats.likes}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Alertas y avisos</h3>
          {alerts.length === 0 ? <p className="mt-1 text-sm text-slate-600">No hay alertas activas.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {alerts.map((n) => <li key={n.id} className="flex items-center justify-between gap-2"><Link href={`/app/momentos/noticias/${n.id}`} className="truncate hover:text-indigo-600">{n.title}</Link><span className="text-amber-600">{n.stats.confirmations}</span></li>)}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Resumen</h3>
          <p className="mt-1 text-sm text-slate-600"><MessageSquare className="mr-1 inline h-3.5 w-3.5" />{news.reduce((a, n) => a + n.stats.comments, 0)} comentarios en noticias</p>
          <p className="mt-0.5 text-sm text-slate-600"><Heart className="mr-1 inline h-3.5 w-3.5" />{news.reduce((a, n) => a + n.stats.likes, 0)} Me gusta acumulados</p>
        </div>
      </aside>
    </section>
  );
}
