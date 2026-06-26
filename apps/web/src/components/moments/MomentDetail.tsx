import { Rocket, ShieldCheck, Bookmark, Share2, MapPin, Clock3, Trash2 } from "lucide-react";
import type { MomentItem } from "./types";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";

function formatRemaining(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expirado";
  const hours = Math.floor(diffMs / 3600_000);
  if (hours >= 1) return `Expira en ${hours} h`;
  return `Expira en ${Math.max(1, Math.floor(diffMs / 60000))} min`;
}

export function MomentDetail({
  moment,
  onBoost,
  onConfirm,
  onSave,
  onShare,
  onDelete,
}: {
  moment: MomentItem;
  onBoost?: () => void;
  onConfirm?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}) {
  const mediaSrc = moment.media[0]?.url ? buildMomentMediaUrl(moment.media[0].url) : null;

  return (
    <article className="space-y-4 rounded-3xl border bg-white p-5">
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl sm:h-[420px]">
        {mediaSrc ? (
          <img src={mediaSrc} alt={moment.title} className="h-full w-full object-cover" />
        ) : (
          <MomentMediaFallback momentType={moment.type} title={moment.title} />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{moment.author.name.slice(0, 1).toUpperCase()}</span>
        <span className="font-semibold">{moment.author.name}</span>
      </div>

      <h1 className="text-3xl font-black text-slate-900">{moment.title}</h1>
      {moment.description ? <p className="text-slate-600">{moment.description}</p> : null}

      <div className="space-y-1 text-sm text-slate-600">
        {moment.location ? <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{moment.location}</p> : null}
        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" />{formatRemaining(moment.expiresAt)}</p>
      </div>

      {moment.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">{moment.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs">#{tag}</span>)}</div>
      ) : null}

      <div className="grid grid-cols-4 divide-x divide-slate-100 rounded-2xl border bg-slate-50 py-3 text-center text-sm">
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.boosts}</span>impulsos</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.confirmations}</span>confirm.</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.comments}</span>coment.</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.views}</span>vistas</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onBoost} disabled={!onBoost} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${moment.viewerState.boosted ? "bg-indigo-100 text-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-50`}><Rocket className="h-4 w-4" />{moment.viewerState.boosted ? "Impulsado" : "Impulsar"}</button>
        <button onClick={onConfirm} disabled={!onConfirm} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${moment.viewerState.confirmed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}><ShieldCheck className="h-4 w-4" />{moment.viewerState.confirmed ? "Confirmado" : "Confirmar"}</button>
        <button onClick={onSave} disabled={!onSave} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${moment.viewerState.saved ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}><Bookmark className="h-4 w-4" />{moment.viewerState.saved ? "Guardado" : "Guardar"}</button>
        <button onClick={onShare} disabled={!onShare} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Share2 className="h-4 w-4" />Compartir</button>
        {onDelete ? <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Eliminar</button> : null}
      </div>
    </article>
  );
}
