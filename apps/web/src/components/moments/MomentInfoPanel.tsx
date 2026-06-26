import Link from "next/link";
import { Rocket, Clock3, MapPin, MessageCircle, Share2, SkipForward, Timer, Bookmark, ShieldCheck, Eye } from "lucide-react";
import type { MomentItem } from "./types";

function formatRelative(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.round(hours / 24)} d`;
}

function formatRemaining(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expirado";
  const hours = Math.floor(diffMs / 3600_000);
  if (hours >= 1) return `Expira en ${hours} h`;
  const min = Math.max(1, Math.floor(diffMs / 60000));
  return `Expira en ${min} min`;
}

export function MomentInfoPanel({
  moment,
  onBoost,
  onPass,
  onConfirm,
  onComment,
  onSave,
  onShare,
}: {
  moment: MomentItem;
  onBoost: () => void;
  onPass: () => void;
  onConfirm: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
}) {
  const boosted = moment.viewerState.boosted;
  const confirmed = moment.viewerState.confirmed;
  const saved = moment.viewerState.saved;

  return (
    <div className="flex min-w-0 flex-col space-y-5 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="min-w-0">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{moment.title}</h2>
        {moment.description ? <p className="mt-2 text-base leading-relaxed text-slate-600">{moment.description}</p> : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {moment.author.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-semibold">{moment.author.name}</span>
        <span className="text-slate-400">·</span>
        <span className="inline-flex items-center gap-1 text-slate-500"><Eye className="h-3.5 w-3.5" />{moment.stats.views}</span>
      </div>

      <div className="space-y-2 border-y border-slate-100 py-3 text-sm text-slate-600">
        {moment.location ? <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{moment.location}</p> : null}
        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" />{formatRemaining(moment.expiresAt)}</p>
        <p className="flex items-center gap-2"><Timer className="h-4 w-4 text-slate-400" />{formatRelative(moment.createdAt)}</p>
      </div>

      {moment.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">{moment.tags.map((tag) => <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700" key={tag}>#{tag}</span>)}</div>
      ) : null}

      <div className="grid grid-cols-4 divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-center text-sm">
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.boosts}</span>impulsos</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.confirmations}</span>confirm.</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.comments}</span>coment.</p>
        <p><span className="block text-lg font-bold text-slate-900">{moment.stats.shares}</span>compart.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBoost}
          aria-pressed={boosted}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold shadow-md transition ${boosted ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300" : "bg-indigo-600 text-white hover:brightness-110"}`}
        >
          <Rocket className="h-4 w-4" />{boosted ? "Impulsado" : "Impulsar"}
        </button>
        <button
          onClick={onConfirm}
          aria-pressed={confirmed}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition ${confirmed ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"}`}
        >
          <ShieldCheck className="h-4 w-4" />{confirmed ? "Confirmado" : "Confirmar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <button onClick={onPass} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50">
          <SkipForward className="h-4 w-4" />Pasar
        </button>
        <button onClick={onComment} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50">
          <MessageCircle className="h-4 w-4" />Comentar
        </button>
        <button onClick={onSave} aria-pressed={saved} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 font-medium transition ${saved ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
          <Bookmark className="h-4 w-4" />{saved ? "Guardado" : "Guardar"}
        </button>
        <button onClick={onShare} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50">
          <Share2 className="h-4 w-4" />Compartir
        </button>
      </div>

      <Link
        href={`/app/momentos/${moment.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        Ver detalles
      </Link>
    </div>
  );
}
