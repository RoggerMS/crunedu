import { TrendingUp, Hash } from "lucide-react";
import type { MomentTopic, MomentTrend } from "./types";

export function MomentsTrendsView({
  trends,
  topics,
  onView,
}: {
  trends: MomentTrend[];
  topics: MomentTopic[];
  onView: (tag: string) => void;
}) {
    const totalMoments = trends.reduce((a, t) => a + t.moments, 0);
    const totalLikes = trends.reduce((a, t) => a + t.likes, 0);

  if (trends.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Tendencias</h1>
        <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-slate-600">Aún no hay tendencias. Vuelve más tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Tendencias</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-xl bg-white px-3 py-1.5 font-medium shadow-sm">{totalMoments} momentos</span>
          <span className="rounded-xl bg-white px-3 py-1.5 font-medium shadow-sm">{totalLikes} Me gusta</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {trends.map((t) => (
          <article key={t.tag} className="flex items-center gap-4 rounded-2xl border bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 font-black text-indigo-700">{t.position}</span>
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1 font-bold text-slate-900"><Hash className="h-4 w-4 text-slate-400" />{t.tag}</h3>
              <p className="text-sm text-slate-600">{t.moments} momentos · {t.likes} Me gusta</p>
              {t.growth > 0 ? <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" />+{t.growth}%</p> : null}
            </div>
            <button onClick={() => onView(t.tag)} className="shrink-0 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Explorar</button>
          </article>
        ))}
      </div>

      {topics.length > 0 ? (
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold text-slate-900">Temas disponibles</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {topics.map((t) => <button key={t.tag} onClick={() => onView(t.tag)} className="rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200">#{t.tag} · {t.count}</button>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
