import { Flame, MessageSquare, Heart } from "lucide-react";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";
import type { MomentNewsSummary } from "./types";

export function MomentNewsCard({ item }: { item: MomentNewsSummary }) {
  const coverSrc = item.coverImageUrl ? buildMomentMediaUrl(item.coverImageUrl) : null;
  return (
    <article className="grid gap-3 rounded-2xl border bg-white p-3 transition hover:shadow-md md:grid-cols-[220px_1fr]">
      <div className="h-40 overflow-hidden rounded-xl">
        {coverSrc ? (
          <img src={coverSrc} alt={item.title} className="h-40 w-full rounded-xl object-cover" loading="lazy" />
        ) : (
          <MomentMediaFallback momentType={item.tags.some((t) => /evento/i.test(t)) ? "event" : item.tags.some((t) => /aviso|alerta/i.test(t)) ? "alert" : "campus"} title={item.title} compact />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
        <p className="text-sm text-slate-600">{item.summary}</p>
        <div className="mt-2 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{tag}</span>)}</div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{item.stats.likes}</span>
          <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{item.stats.confirmations} confirmaciones</span>
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{item.stats.comments}</span>
        </div>
        <span className="mt-3 inline-block rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Leer detalles</span>
      </div>
    </article>
  );
}
