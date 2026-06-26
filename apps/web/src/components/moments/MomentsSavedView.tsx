import Link from "next/link";
import { Share2, Trash2, Eye } from "lucide-react";
import type { MomentItem } from "./types";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";

function isExpired(m: MomentItem) {
  return new Date(m.expiresAt).getTime() <= Date.now();
}

export function MomentsSavedView({
  moments,
  onRemove,
  onShare,
}: {
  moments: MomentItem[];
  onRemove: (id: string) => void;
  onShare?: (id: string) => void;
}) {
  if (moments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
        <p className="text-slate-700">No tienes momentos guardados.</p>
        <Link href="/app/momentos" className="mt-3 inline-block rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Volver a Momentos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {moments.map((m) => {
        const expired = isExpired(m);
        return (
          <article key={m.id} className="flex items-center gap-3 rounded-2xl border bg-white p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              {m.media[0]?.url ? (
                <img src={buildMomentMediaUrl(m.media[0].url)} alt={m.title} className="h-full w-full object-cover" />
              ) : (
                <MomentMediaFallback momentType={m.type} title={m.title} compact />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-semibold text-slate-800">{m.title}</p>
              <p className="text-xs text-slate-600">{m.location ?? "Sin ubicación"} · {m.stats.boosts} impulsos</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${expired ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                {expired ? "Expirado" : "Activo"}
              </span>
            </div>
            <div className="flex shrink-0 gap-1">
              <Link href={`/app/momentos/${m.id}`} aria-label="Ver" className="rounded-xl border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" /></Link>
              {onShare ? <button onClick={() => onShare(m.id)} aria-label="Compartir" className="rounded-xl border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Share2 className="h-4 w-4" /></button> : null}
              <button onClick={() => onRemove(m.id)} aria-label="Quitar" className="rounded-xl border border-slate-300 p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
