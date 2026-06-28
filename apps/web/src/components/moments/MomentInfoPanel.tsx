import Link from "next/link";
import {
  Heart,
  Clock3,
  MapPin,
  MessageCircle,
  Share2,
  Bookmark,
  Check,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import type { MomentItem } from "./types";

function formatRelative(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.round(hours / 24)} d`;
}

function formatRemaining(expiresAt: string | null, isPermanent: boolean) {
  if (isPermanent || !expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expirado";
  const hours = Math.floor(diffMs / 3600_000);
  if (hours >= 1) return `Expira en ${hours} h`;
  const min = Math.max(1, Math.floor(diffMs / 60000));
  return `Expira en ${min} min`;
}

export function MomentInfoPanel({
  moment,
  onLike,
  onConfirm,
  onComment,
  onSave,
  onShare,
  onShareToFeed,
  onRemoveFromFeed,
  onDelete,
}: {
  moment: MomentItem;
  onLike: () => void;
  onConfirm: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onShareToFeed?: () => void;
  onRemoveFromFeed?: () => void;
  onDelete?: () => void;
}) {
  const liked = moment.viewerState.liked;
  const confirmed = moment.viewerState.confirmed;
  const saved = moment.viewerState.saved;
  const remaining = formatRemaining(
    moment.expiresAt ?? null,
    moment.isPermanent ?? false,
  );

  return (
    <div className="flex min-w-0 flex-col space-y-4 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="min-w-0">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {moment.title}
        </h2>
        {moment.description ? (
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            {moment.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {moment.author.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-semibold">{moment.author.name}</span>
        <span className="text-slate-400">·</span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Eye className="h-3.5 w-3.5" />
          {moment.stats.views}
        </span>
      </div>

      <div className="space-y-1 border-y border-slate-100 py-3 text-sm text-slate-600">
        {moment.location ? (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            {moment.location}
          </p>
        ) : null}
        {remaining ? (
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />
            {remaining}
          </p>
        ) : null}
        <p className="flex items-center gap-2 text-slate-400">
          {formatRelative(moment.createdAt)}
        </p>
      </div>

      {moment.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {moment.tags.map((tag) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              key={tag}
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Heart
            className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
          />
          {moment.stats.likes} Me gusta
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4 text-slate-400" />
          {moment.stats.comments}
        </span>
        <span className="inline-flex items-center gap-1">
          <Share2 className="h-4 w-4 text-slate-400" />
          {moment.stats.shares}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onLike}
          aria-pressed={liked}
          aria-label={liked ? "Quitar Me gusta" : "Me gusta"}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold shadow-md transition ${liked ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200" : "bg-indigo-600 text-white hover:brightness-110"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-rose-500" : ""}`} />
          {liked ? "Te gusta" : "Me gusta"}
        </button>
        <button
          onClick={onConfirm}
          aria-pressed={confirmed}
          aria-label={confirmed ? "Quitar confirmación" : "Confirmar"}
          title="Confirma solamente si puedes comprobar que este Momento es real o está sucediendo."
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition ${confirmed ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"}`}
        >
          <Check className="h-4 w-4" />
          {confirmed ? "Confirmado" : "Confirmar"}
        </button>
      </div>

      {moment.isMine ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
            Herramientas del autor
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <button
              onClick={moment.inFeed ? onRemoveFromFeed : onShareToFeed}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
            >
              <Share2 className="h-4 w-4" />
              {moment.inFeed ? "Quitar del Feed" : "Mostrar en Feed"}
            </button>
            {moment.canDelete ? (
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <button
          onClick={onComment}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <MessageCircle className="h-4 w-4" />
          Comentar
        </button>
        <button
          onClick={onSave}
          aria-pressed={saved}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 font-medium transition ${saved ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-indigo-500" : ""}`} />
          {saved ? "Guardado" : "Guardar"}
        </button>
        <button
          onClick={onShare}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Send className="h-4 w-4" />
          Compartir
        </button>
        <Link
          href={`/app/momentos/${moment.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 font-medium text-indigo-700 transition hover:bg-indigo-100"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
