"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreateMomentModal } from "@/components/moments/CreateMomentModal";
import { MomentCommentsDrawer } from "@/components/moments/MomentCommentsDrawer";
import { MomentHistoryStrip } from "@/components/moments/MomentHistoryStrip";
import { MomentsGalleryView } from "@/components/moments/MomentsGalleryView";
import { MomentsHeader } from "@/components/moments/MomentsHeader";
import { MomentsNewsView } from "@/components/moments/MomentsNewsView";
import { MomentsPortalLayout } from "@/components/moments/MomentsPortalLayout";
import { MomentsSavedView } from "@/components/moments/MomentsSavedView";
import { MomentsTrendsView } from "@/components/moments/MomentsTrendsView";
import { MomentViewer } from "@/components/moments/MomentViewer";
import { useMoments } from "@/hooks/useMoments";

function MomentsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 rounded-[2rem] border border-slate-200 bg-white p-3 md:p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
      <div className="h-[360px] rounded-3xl bg-slate-200 md:h-[520px]" />
      <div className="space-y-4 p-4">
        <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      <button onClick={onRetry} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
        Reintentar
      </button>
    </div>
  );
}

function ViewPreferenceModal({ onChoose }: { onChoose: (mode: "single" | "explore") => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-xl font-black text-slate-900">¿Cómo prefieres explorar Momentos?</h2>
        <p className="mt-1 text-sm text-slate-600">Puedes cambiarlo cuando quieras desde la cabecera.</p>
        <div className="mt-4 space-y-3">
          <button onClick={() => onChoose("single")} className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">1</span>
            <span>
              <span className="block font-semibold text-slate-800">Ver uno por uno</span>
              <span className="block text-xs text-slate-500">Explora una publicación a la vez y navega con las flechas.</span>
            </span>
          </button>
          <button onClick={() => onChoose("explore")} className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">2</span>
            <span>
              <span className="block font-semibold text-slate-800">Explorar en tarjetas</span>
              <span className="block text-xs text-slate-500">Mira varias publicaciones, noticias, fotografías y videos antes de elegir cuál abrir.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MomentsPage() {
  const moments = useMoments();
  const [showCreate, setShowCreate] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Explore mode defaults to the news view.
  useEffect(() => {
    if (moments.preferenceAsked && moments.viewMode === "explore" && moments.activeView === "moments") {
      moments.setActiveView("news");
    }
  }, [moments.preferenceAsked, moments.viewMode]);

  function openComments() {
    if (moments.currentMoment) {
      void moments.openComments(moments.currentMoment.id);
      setShowComments(true);
    }
  }

  // Keyboard navigation (left/right) only in single view, not while typing or modal open.
  useEffect(() => {
    if (moments.viewMode !== "single" || moments.activeView !== "moments") return;
    function onKey(e: KeyboardEvent) {
      if (showCreate || showComments) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); moments.previousMoment(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); moments.nextMoment(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moments, showCreate, showComments]);

  return (
    <MomentsPortalLayout>
      <MomentsHeader activeView={moments.activeView} setActiveView={moments.setActiveView} query={moments.query} setQuery={moments.setQuery} viewMode={moments.viewMode} onChangeViewMode={moments.setViewMode} />
      <section className="mx-auto max-w-[1680px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        {moments.toast ? <p className="mb-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{moments.toast}</p> : null}

        {moments.activeView === "moments" ? (
          moments.loading ? <MomentsSkeleton /> :
          moments.error ? <ErrorState message={moments.error} onRetry={moments.retry} /> :
          moments.currentMoment ? (
            <>
              <MomentViewer
                moment={moments.currentMoment}
                previousMoment={moments.previousMoment}
                nextMoment={moments.nextMoment}
                onLike={() => moments.currentMoment && moments.likeMoment(moments.currentMoment.id)}
                onConfirm={() => moments.currentMoment && moments.confirmMoment(moments.currentMoment.id)}
                onComment={openComments}
                onSave={() => moments.currentMoment && moments.saveMoment(moments.currentMoment.id)}
                onShare={() => moments.currentMoment && moments.shareMoment(moments.currentMoment.id)}
              />
              <MomentHistoryStrip moments={moments.filteredMoments.slice(0, 8)} currentMomentId={moments.currentMoment?.id} selectFromHistory={moments.selectFromHistory} />
              <p className="hidden text-center text-xs text-slate-400 lg:block">Usa las flechas ← → del teclado para navegar</p>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
              <p className="text-slate-700">No hay momentos activos ahora.</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Crear momento
              </button>
            </div>
          )
        ) : null}

        {moments.activeView === "news" ? (
          moments.newsLoading ? <MomentsSkeleton /> :
          moments.newsError ? <ErrorState message={moments.newsError} onRetry={moments.retry} /> :
          <MomentsNewsView news={moments.newsSummaries} />
        ) : null}

        {moments.activeView === "gallery" ? (
          moments.galleryLoading ? <MomentsSkeleton /> :
          moments.galleryError ? <ErrorState message={moments.galleryError} onRetry={moments.retry} /> :
          <MomentsGalleryView moments={moments.galleryMoments} loading={false} />
        ) : null}

        {moments.activeView === "saved" ? (
          moments.savedLoading ? <MomentsSkeleton /> :
          moments.savedError ? <ErrorState message={moments.savedError} onRetry={moments.retry} /> :
          <MomentsSavedView moments={moments.savedMoments} onRemove={moments.saveMoment} onShare={moments.shareMoment} />
        ) : null}

        {moments.activeView === "trends" ? (
          moments.trendsLoading ? <MomentsSkeleton /> :
          moments.trendsError ? <ErrorState message={moments.trendsError} onRetry={moments.retry} /> :
          <MomentsTrendsView trends={moments.trends} topics={moments.topics} onView={(tag) => moments.setQuery(tag)} />
        ) : null}
      </section>

      <button
        onClick={() => setShowCreate(true)}
        title="Crear momento"
        aria-label="Crear momento"
        className="group fixed bottom-6 right-6 rounded-full bg-indigo-600 p-4 text-white shadow-[0_16px_32px_-10px_rgba(79,70,229,0.55)] transition hover:scale-105 hover:brightness-110"
      >
        +
      </button>
      <Link href="/app/momentos/crear" className="sr-only">Crear momento</Link>

      <MomentCommentsDrawer
        open={showComments}
        onClose={() => setShowComments(false)}
        comments={commentsForCurrent(moments.comments, moments.currentMoment?.id)}
        loading={moments.commentsLoading}
        onComment={(text) => moments.currentMoment && moments.commentMoment(moments.currentMoment.id, text)}
        onDelete={(commentId) => moments.currentMoment && moments.deleteComment(moments.currentMoment.id, commentId)}
      />

      {showCreate ? (
        <CreateMomentModal
          submitting={moments.submitting}
          onClose={() => setShowCreate(false)}
          onCreate={moments.createMoment}
          onUpload={moments.uploadMedia}
        />
      ) : null}

      {!moments.preferenceAsked ? <ViewPreferenceModal onChoose={moments.setViewMode} /> : null}
    </MomentsPortalLayout>
  );
}

function commentsForCurrent(comments: ReturnType<typeof useMoments>["comments"], momentId?: string) {
  return momentId ? comments.filter((c) => c.momentId === momentId) : [];
}
