"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NoteDetail } from "@/components/notes/NoteDetail";
import { EditNoteModal } from "@/components/notes/EditNoteModal";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import {
  createReport,
  deleteNote,
  getNoteById,
  getNotes,
  mapApiError,
  rateNote,
  saveNote,
  unsaveNote,
  type NoteApiItem,
} from "@/lib/api-helpers";
import { buildNoteDownloadUrl } from "@/lib/api-helpers";
import type { NoteItem } from "@/components/notes/types";

function mapDetail(api: NoteApiItem): NoteItem {
  return {
    id: String(api.id),
    title: api.title,
    description: api.description,
    course: api.course,
    cycle: api.cycle,
    materialType: api.materialType,
    file: {
      name: api.originalName ?? api.title,
      url: api.fileUrl,
      downloadUrl: buildNoteDownloadUrl(api.id),
      size: api.sizeBytes,
      mimeType: api.mimeType ?? "",
      fileType: api.fileType as NoteItem["file"]["fileType"],
    },
    author: api.author,
    community: api.community,
    visibility: api.visibility as NoteItem["visibility"],
    tags: api.tags,
    createdAt: api.createdAt,
    rating: { average: api.rating.average, count: api.rating.count, viewerRating: api.rating.viewerRating },
    stats: { downloads: api.stats.downloads, saves: api.stats.saves, views: api.stats.views },
    viewerState: api.viewerState,
  };
}

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const { communities } = useCommunities();
  const [note, setNote] = useState<NoteItem | null>(null);
  const [related, setRelated] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const notify = (message: string, type: "success" | "error" | "info" = "info") => { setToast({ message, type }); window.setTimeout(() => setToast(null), 3000); };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getNoteById(params.id);
      const mapped = mapDetail(data);
      setNote(mapped);
      const relatedQuery = mapped.course ? { course: mapped.course, sort: "best_rated" as const, limit: 5 } : { sort: "recent" as const, limit: 5 };
      try {
        const list = await getNotes(relatedQuery);
        setRelated((list.items ?? []).filter((item) => String(item.id) !== String(params.id)).slice(0, 4).map(mapDetail));
      } catch {
        setRelated([]);
      }
    } catch (err) {
      setError(mapApiError(err, "No encontramos este apunte."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [params.id]);

  async function handleRate(value: number) {
    if (!note) return;
    if (!isAuthenticated || !accessToken) return notify("Inicia sesión para valorar este apunte.", "info");
    setRatingBusy(true);
    setNote((prev) => prev ? { ...prev, rating: { ...prev.rating, viewerRating: value } } : prev);
    try {
      const result = await rateNote(Number(note.id), value, accessToken);
      setNote((prev) => prev ? { ...prev, rating: { average: result.average, count: result.count, viewerRating: result.viewerRating } } : prev);
      notify("Gracias por valorar este apunte.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo registrar tu valoración."), "error");
      void load();
    } finally {
      setRatingBusy(false);
    }
  }

  async function handleSave() {
    if (!note) return;
    if (!isAuthenticated || !accessToken) return notify("Inicia sesión para guardar apuntes.", "info");
    const wasSaved = note.viewerState.saved;
    setNote((prev) => prev ? { ...prev, viewerState: { ...prev.viewerState, saved: !wasSaved }, stats: { ...prev.stats, saves: Math.max(0, prev.stats.saves + (wasSaved ? -1 : 1)) } } : prev);
    try {
      if (wasSaved) await unsaveNote(Number(note.id), accessToken);
      else await saveNote(Number(note.id), accessToken);
      notify(wasSaved ? "Apunte quitado de guardados." : "Apunte guardado.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo actualizar el guardado."), "error");
      void load();
    }
  }

  async function handleShare() {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/apuntes/${note.id}`);
      notify("Enlace de apunte copiado.", "success");
    } catch {
      notify("No se pudo copiar el enlace.", "error");
    }
  }

  function handleDownload() {
    if (!note) return;
    window.open(buildNoteDownloadUrl(note.id), "_blank");
  }

  async function handleReport() {
    if (!note) return;
    if (!isAuthenticated || !accessToken) return notify("Inicia sesión para reportar este apunte.", "info");
    try {
      await createReport({ targetType: "DOCUMENT", targetId: Number(note.id), reason: "Reporte de apunte" }, accessToken);
      notify("Reporte enviado.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo enviar el reporte."), "error");
    }
  }

  async function handleDelete() {
    if (!note) return;
    if (!accessToken) return notify("Inicia sesión para eliminar tu apunte.", "info");
    const confirmed = window.confirm("¿Seguro que deseas eliminar este apunte? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    try {
      await deleteNote(Number(note.id), accessToken);
      notify("Apunte eliminado.", "success");
      router.push("/app/apuntes");
    } catch (err) {
      notify(mapApiError(err, "No se pudo eliminar el apunte."), "error");
    }
  }

  function handleEdit() {
    if (!note || !accessToken) return;
    setEditModalOpen(true);
  }

  function handleNoteUpdated(updated: NoteItem) {
    setNote(updated);
  }

  if (loading) return <section className="mx-auto max-w-[1200px] space-y-4 px-4 py-6 sm:px-6 lg:px-8"><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></section>;
  if (error || !note) return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">{error ?? "No encontramos este apunte."}</p>
        <Link className="mt-3 inline-block text-sm font-semibold text-indigo-700" href="/app/apuntes">Volver a Apuntes</Link>
      </div>
    </section>
  );

  return (
    <section className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      {toast ? <div role="alert" className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
      <NoteDetail
        note={note}
        related={related}
        onRate={(value) => void handleRate(value)}
        onSave={() => void handleSave()}
        onShare={() => void handleShare()}
        onDownload={handleDownload}
        onReport={() => void handleReport()}
        onDelete={note.viewerState.canDelete ? () => void handleDelete() : undefined}
        onEdit={note.viewerState.canEdit ? () => handleEdit() : undefined}
        ratingBusy={ratingBusy}
      />
      <EditNoteModal
        open={editModalOpen}
        note={note}
        communities={communities}
        accessToken={accessToken}
        onClose={() => setEditModalOpen(false)}
        onUpdated={handleNoteUpdated}
        onToast={notify}
      />
    </section>
  );
}
