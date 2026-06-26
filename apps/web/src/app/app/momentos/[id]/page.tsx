"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MomentDetail } from "@/components/moments/MomentDetail";
import {
  boostMoment as apiBoostMoment,
  confirmMoment as apiConfirmMoment,
  createMomentComment as apiCreateMomentComment,
  deleteMoment as apiDeleteMoment,
  getMomentById,
  getMomentComments,
  saveMoment as apiSaveMoment,
  shareMoment as apiShareMoment,
  unboostMoment as apiUnboostMoment,
  unconfirmMoment as apiUnconfirmMoment,
  unsaveMoment as apiUnsaveMoment,
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
    tags: item.tags,
    media: item.media.map((m) => ({ id: m.id, type: m.type, url: m.url, alt: m.alt ?? undefined })),
    author: { id: item.author.id, name: item.author.name, avatarUrl: item.author.avatarUrl ?? undefined },
    stats: item.stats,
    viewerState: { boosted: item.viewerState.boosted, passed: false, saved: item.viewerState.saved, confirmed: item.viewerState.confirmed },
    status: item.status as MomentItem["status"],
    isMine: item.isMine,
    canEdit: item.canEdit,
    canDelete: item.canDelete,
  };
}

export default function MomentDetailPage() {
  const params = useParams<{ id: string }>();
  const [moment, setMoment] = useState<MomentItem | null>(null);
  const [comments, setComments] = useState<MomentCommentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

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

  async function onBoost() {
    if (!moment) return;
    const wasBoosted = moment.viewerState.boosted;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, boosted: !wasBoosted }, stats: { ...m.stats, boosts: m.stats.boosts + (wasBoosted ? -1 : 1) } }));
    try {
      const res = wasBoosted ? await apiUnboostMoment(moment.id) : await apiBoostMoment(moment.id);
      update((m) => ({ ...m, stats: { ...m.stats, boosts: res.count }, viewerState: { ...m.viewerState, boosted: res.boosted } }));
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, boosted: wasBoosted }, stats: { ...m.stats, boosts: m.stats.boosts + (wasBoosted ? 1 : -1) } }));
      showToast(mapApiError(err, "No se pudo actualizar el impulso."));
    }
  }

  async function onConfirm() {
    if (!moment) return;
    const wasConfirmed = moment.viewerState.confirmed;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, confirmed: !wasConfirmed }, stats: { ...m.stats, confirmations: m.stats.confirmations + (wasConfirmed ? -1 : 1) } }));
    try {
      const res = wasConfirmed ? await apiUnconfirmMoment(moment.id) : await apiConfirmMoment(moment.id);
      update((m) => ({ ...m, stats: { ...m.stats, confirmations: res.count }, viewerState: { ...m.viewerState, confirmed: res.confirmed } }));
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, confirmed: wasConfirmed }, stats: { ...m.stats, confirmations: m.stats.confirmations + (wasConfirmed ? 1 : -1) } }));
      showToast(mapApiError(err, "No se pudo confirmar."));
    }
  }

  async function onSave() {
    if (!moment) return;
    const wasSaved = moment.viewerState.saved;
    update((m) => ({ ...m, viewerState: { ...m.viewerState, saved: !wasSaved } }));
    try {
      if (wasSaved) await apiUnsaveMoment(moment.id); else await apiSaveMoment(moment.id);
      showToast(wasSaved ? "Quitado de guardados." : "Momento guardado.");
    } catch (err) {
      update((m) => ({ ...m, viewerState: { ...m.viewerState, saved: wasSaved } }));
      showToast(mapApiError(err, "No se pudo actualizar el guardado."));
    }
  }

  async function onShare() {
    if (!moment) return;
    try { await apiShareMoment(moment.id); update((m) => ({ ...m, stats: { ...m.stats, shares: m.stats.shares + 1 } })); } catch { /* best-effort */ }
    const link = `${window.location.origin}/app/momentos/${moment.id}`;
    if (navigator.clipboard) await navigator.clipboard.writeText(link).catch(() => undefined);
    showToast("Enlace copiado.");
  }

  async function onComment() {
    if (!moment || !commentText.trim()) return;
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
    if (!window.confirm("¿Seguro que deseas eliminar este momento?")) return;
    try {
      await apiDeleteMoment(moment.id);
      window.location.href = "/app/momentos";
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
          <Link href="/app/momentos" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Volver a Momentos</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href="/app/momentos" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><ArrowLeft size={16} /> Volver a Momentos</Link>
        {toast ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</p> : null}
        <MomentDetail
          moment={moment}
          onBoost={onBoost}
          onConfirm={onConfirm}
          onSave={onSave}
          onShare={onShare}
          onDelete={moment.canDelete ? onDelete : undefined}
        />
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
            <button onClick={onComment} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Publicar</button>
          </div>
        </section>
      </div>
    </main>
  );
}
