"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Heart, Check, Bookmark, Send, Trash2, Eye, MessageCircle, Share2, LayoutGrid } from "lucide-react";
import { MomentMediaFallback } from "@/components/moments/MomentMediaFallback";
import {
  likeMoment as apiLikeMoment,
  confirmMoment as apiConfirmMoment,
  createMomentComment as apiCreateMomentComment,
  deleteMoment as apiDeleteMoment,
  getMomentById,
  getMomentComments,
  saveMoment as apiSaveMoment,
  shareMoment as apiShareMoment,
  shareMomentToFeed as apiShareToFeed,
  unconfirmMoment as apiUnconfirmMoment,
  unlikeMoment as apiUnlikeMoment,
  unsaveMoment as apiUnsaveMoment,
  removeMomentFromFeed as apiRemoveFromFeed,
  buildMomentMediaUrl,
  type MomentDetailApi,
  type MomentCommentApi,
} from "@/lib/moments-api";
import { mapApiError } from "@/lib/http-client";
import type { MomentItem } from "@/components/moments/types";

function mapDetail(item: MomentDetailApi): MomentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    type: item.type as MomentItem["type"],
    location: item.location ?? undefined,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    isPermanent: item.isPermanent,
    inFeed: item.inFeed,
    tags: item.tags,
    media: item.media.map((m) => ({ id: m.id, type: m.type, url: m.url, alt: m.alt ?? undefined })),
    author: { id: item.author.id, name: item.author.name, avatarUrl: item.author.avatarUrl ?? undefined },
    stats: item.stats,
    viewerState: { liked: item.viewerState.liked, saved: item.viewerState.saved, confirmed: item.viewerState.confirmed },
    status: item.status as MomentItem["status"],
    isMine: item.isMine,
    canEdit: item.canEdit,
    canDelete: item.canDelete,
  };
}

function backHrefFrom(from: string | null): string {
  if (from === "news") return "/app/momentos";
  if (from === "gallery") return "/app/momentos";
  if (from === "saved") return "/app/momentos";
  if (from === "feed") return "/app";
  return "/app/momentos";
}

function backLabelFrom(from: string | null): string {
  if (from === "feed") return "Volver al Feed";
  return "Volver a Momentos";
}

export default function MomentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [moment, setMoment] = useState<MomentItem | null>(null);
  const [comments, setComments] = useState<MomentCommentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, commentsRes] = await Promise.all([getMomentById(params.id), getMomentComments(params.id)]);
      setMoment(mapDetail(detail));
      setComments(commentsRes);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar el momento."));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void fetchDetail(); }, [fetchDetail]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }
  function update(fn: (m: MomentItem) => MomentItem) {
    setMoment((m) => (m ? fn(m) : m));
  }

  async function onLike() {
    if (!moment || busy) return;
    setBusy(true);
    const wasLiked = moment.viewerState.liked;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, liked: !wasLiked }, stats: { ...m.stats, likes: m.stats.likes + (wasLiked ? -1 : 1) } }));
    try {
      const res = wasLiked ? await apiUnlikeMoment(moment.id) : await apiLikeMoment(moment.id);
      update((m) => ({ ...m, stats: { ...m.stats, likes: res.count }, viewerState: { ...m.viewerState, liked: res.liked } }));
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, liked: wasLiked }, stats: { ...m.stats, likes: m.stats.likes + (wasLiked ? 1 : -1) } }));
      showToast(mapApiError(err, "No se pudo actualizar el Me gusta."));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm() {
    if (!moment || busy) return;
    setBusy(true);
    const wasConfirmed = moment.viewerState.confirmed;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, confirmed: !wasConfirmed }, stats: { ...m.stats, confirmations: m.stats.confirmations + (wasConfirmed ? -1 : 1) } }));
    try {
      const res = wasConfirmed ? await apiUnconfirmMoment(moment.id) : await apiConfirmMoment(moment.id);
      update((m) => ({ ...m, stats: { ...m.stats, confirmations: res.count }, viewerState: { ...m.viewerState, confirmed: res.confirmed } }));
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, confirmed: wasConfirmed }, stats: { ...m.stats, confirmations: m.stats.confirmations + (wasConfirmed ? 1 : -1) } }));
      showToast(mapApiError(err, "No se pudo confirmar."));
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!moment || busy) return;
    setBusy(true);
    const wasSaved = moment.viewerState.saved;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, saved: !wasSaved } }));
    try {
      if (wasSaved) await apiUnsaveMoment(moment.id); else await apiSaveMoment(moment.id);
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, saved: wasSaved } }));
      showToast(mapApiError(err, "No se pudo actualizar el guardado."));
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!moment) return;
    const link = `${window.location.origin}/app/momentos/${moment.id}`;
    try { await apiShareMoment(moment.id); update((m) => ({ ...m, stats: { ...m.stats, shares: m.stats.shares + 1 } })); } catch { /* best-effort */ }
    if (navigator.share) {
      try { await navigator.share({ title: moment.title, url: link }); return; } catch { /* fall through */ }
    }
    if (navigator.clipboard) await navigator.clipboard.writeText(link).catch(() => undefined);
    showToast("Enlace copiado.");
  }

  async function onShareToFeed() {
    if (!moment) return;
    try { await apiShareToFeed(moment.id); update((m) => ({ ...m, inFeed: true })); showToast("Ahora también aparece en tu Feed."); }
    catch (err) { showToast(mapApiError(err, "No se pudo compartir en el Feed.")); }
  }

  async function onRemoveFromFeed() {
    if (!moment) return;
    try { await apiRemoveFromFeed(moment.id); update((m) => ({ ...m, inFeed: false })); showToast("Se quitó del Feed."); }
    catch (err) { showToast(mapApiError(err, "No se pudo quitar del Feed.")); }
  }

  async function onComment() {
    if (!moment || !commentText.trim() || busy) return;
    const text = commentText.trim();
    setCommentText("");
    try {
      const created = await apiCreateMomentComment(moment.id, text);
      setComments((c) => [...c, created]);
      update((m) => ({ ...m, stats: { ...m.stats, comments: m.stats.comments + 1 } }));
    } catch (err) {
      setCommentText(text);
      showToast(mapApiError(err, "No se pudo publicar el comentario."));
    }
  }

  async function onDelete() {
    if (!moment) return;
    if (!window.confirm("¿Seguro que deseas eliminar este momento? Se quitará de Momentos y del Feed.")) return;
    try {
      await apiDeleteMoment(moment.id);
      router.push("/app/momentos");
    } catch (err) {
      showToast(mapApiError(err, "No se pudo eliminar el momento."));
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto flex max-w-4xl items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando momento...</div></main>;
  }

  if (error || !moment) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border bg-white p-6 text-center">
          <p className="text-slate-700">{error ?? "Este momento ya no está disponible."}</p>
          <Link href={backHrefFrom(from)} className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{backLabelFrom(from)}</Link>
        </div>
      </main>
    );
  }

  const mediaSrc = moment.media[0]?.url ? buildMomentMediaUrl(moment.media[0].url) : null;
  const expired = !moment.isPermanent && moment.expiresAt && new Date(moment.expiresAt) <= new Date();

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href={backHrefFrom(from)} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><ArrowLeft size={16} /> {backLabelFrom(from)}</Link>
        {toast ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</p> : null}

        <article className="space-y-4 rounded-3xl border bg-white p-5">
          <div className="relative h-[300px] w-full overflow-hidden rounded-2xl sm:h-[420px]">
            {mediaSrc ? <img src={mediaSrc} alt={moment.title} className="h-full w-full object-cover" /> : <MomentMediaFallback momentType={moment.type} title={moment.title} />}
            {expired ? <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">Expirado</span> : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{moment.author.name.slice(0, 1).toUpperCase()}</span>
            <span className="font-semibold">{moment.author.name}</span>
          </div>

          <h1 className="text-3xl font-black text-slate-900">{moment.title}</h1>
          {moment.description ? <p className="text-slate-600">{moment.description}</p> : null}

          {moment.tags.length > 0 ? <div className="flex flex-wrap gap-2">{moment.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs">#{tag}</span>)}</div> : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4 text-slate-400" />{moment.stats.views}</span>
            <span className="inline-flex items-center gap-1"><Heart className={`h-4 w-4 ${moment.viewerState.liked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />{moment.stats.likes}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4 text-slate-400" />{moment.stats.comments}</span>
            <span className="inline-flex items-center gap-1"><Share2 className="h-4 w-4 text-slate-400" />{moment.stats.shares}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onLike} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${moment.viewerState.liked ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-50`}><Heart className={`h-4 w-4 ${moment.viewerState.liked ? "fill-rose-500" : ""}`} />{moment.viewerState.liked ? "Te gusta" : "Me gusta"}</button>
            <button onClick={onConfirm} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${moment.viewerState.confirmed ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}><Check className="h-4 w-4" />{moment.viewerState.confirmed ? "Confirmado" : "Confirmar"}</button>
            <button onClick={onSave} disabled={busy} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${moment.viewerState.saved ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"} disabled:opacity-50`}><Bookmark className={`h-4 w-4 ${moment.viewerState.saved ? "fill-indigo-500" : ""}`} />{moment.viewerState.saved ? "Guardado" : "Guardar"}</button>
            <button onClick={onShare} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Send className="h-4 w-4" />Compartir</button>
            {moment.isMine ? (
              <>
                {moment.inFeed ? <button onClick={onRemoveFromFeed} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LayoutGrid className="h-4 w-4" />Quitar del Feed</button>
                : <button onClick={onShareToFeed} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><LayoutGrid className="h-4 w-4" />Compartir en Feed</button>}
                {moment.canDelete ? <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Eliminar</button> : null}
              </>
            ) : null}
          </div>
        </article>

        <section className="rounded-3xl border bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Comentarios ({comments.length})</h2>
          <div className="mt-3 space-y-2">
            {comments.length === 0 ? <p className="text-sm text-slate-500">Aún no hay comentarios.</p> : comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-100 p-2 text-sm">
                <b className="text-slate-800">{c.author.name}: </b><span className="text-slate-700">{c.content}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onComment(); }} className="flex-1 rounded-xl border border-slate-300 p-2 text-sm" placeholder="Escribe un comentario" maxLength={1000} />
            <button onClick={onComment} disabled={busy} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Publicar</button>
          </div>
        </section>
      </div>
    </main>
  );
}
