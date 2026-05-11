"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function MomentsPage() {
  const moments = useMoments();
  const [showCreate, setShowCreate] = useState(false);
  const [showComments, setShowComments] = useState(false);

  return <MomentsPortalLayout><MomentsHeader activeView={moments.activeView} setActiveView={moments.setActiveView} query={moments.query} setQuery={moments.setQuery} />
    <section className="mx-auto max-w-[1680px] px-4 py-5">
      {moments.toast ? <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{moments.toast}</p> : null}
      {moments.activeView === "moments" && moments.currentMoment ? <><MomentViewer moment={moments.currentMoment} previousMoment={moments.previousMoment} nextMoment={moments.nextMoment} onBoost={() => moments.boostMoment(moments.currentMoment!.id)} onPass={() => moments.passMoment(moments.currentMoment!.id)} onComment={() => setShowComments(true)} onSave={() => moments.saveMoment(moments.currentMoment!.id)} onShare={() => moments.shareMoment(moments.currentMoment!.id)} /><MomentHistoryStrip moments={moments.filteredMoments.slice(0, 8)} selectFromHistory={moments.selectFromHistory} /></> : null}
      {moments.activeView === "moments" && !moments.currentMoment ? <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p>No hay momentos activos ahora.</p><button onClick={() => setShowCreate(true)} className="mt-3 rounded-xl bg-indigo-600 px-3 py-2 text-white">Crear momento</button></div> : null}
      {moments.activeView === "news" ? <MomentsNewsView news={moments.newsSummaries} onOpenMoments={(id)=>{moments.setActiveView("moments"); moments.selectFromHistory(id);}} /> : null}
      {moments.activeView === "gallery" ? <MomentsGalleryView moments={moments.filteredMoments} /> : null}
      {moments.activeView === "saved" ? <MomentsSavedView moments={moments.savedMoments} onRemove={moments.saveMoment} /> : null}
      {moments.activeView === "trends" ? <MomentsTrendsView moments={moments.moments} onView={(tag)=>moments.setQuery(tag)} /> : null}
    </section>
    <button onClick={() => setShowCreate(true)} className="fixed bottom-6 right-6 rounded-full bg-indigo-600 p-4 text-white shadow-lg">+</button>
    <Link href="/app/momentos/crear" className="sr-only">Crear momento</Link>
    <MomentCommentsDrawer open={showComments} onClose={() => setShowComments(false)} comments={moments.comments.filter((c)=>c.momentId===moments.currentMoment?.id)} onComment={(text)=>moments.currentMoment && moments.commentMoment(moments.currentMoment.id, text)} />
    {showCreate ? <CreateMomentModal onClose={() => setShowCreate(false)} onCreate={(input)=>moments.createMoment({ ...input, media: [{ id: `${Date.now()}-media`, type: "image", url: `https://picsum.photos/seed/${Date.now()}/1200/700` }] })} onDraft={moments.saveDraft} /> : null}
  </MomentsPortalLayout>;
}
