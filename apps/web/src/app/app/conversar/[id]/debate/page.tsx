"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversarChangeStanceModal } from "@/components/conversar/ConversarChangeStanceModal";
import { ConversarConsentModal } from "@/components/conversar/ConversarConsentModal";
import { ConversarDebateControls } from "@/components/conversar/ConversarDebateControls";
import { ConversarDebateHeader } from "@/components/conversar/ConversarDebateHeader";
import { ConversarDebateSidePanel } from "@/components/conversar/ConversarDebateSidePanel";
import { ConversarDebateStanceColumn } from "@/components/conversar/ConversarDebateStanceColumn";
import { ConversarProposeStanceModal } from "@/components/conversar/ConversarProposeStanceModal";
import { ConversarSharedLinkModal } from "@/components/conversar/ConversarSharedLinkModal";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { DebateStance } from "@/modules/conversar/types";

const fallbackStances: DebateStance[] = [
  { id: "fallback-favor", title: "A favor", participants: 0, arguments: [] },
  { id: "fallback-contra", title: "En contra", participants: 0, arguments: [] },
  { id: "fallback-depende", title: "Depende del uso", participants: 0, arguments: [] },
];

export default function ConversarDebatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  const conversation = useMemo(() => mockConversations.find((item) => item.id === params.id), [params.id]);

  if (!conversation) {
    return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-xl font-bold text-slate-900">Debate no encontrado</h1><p className="mt-2 text-slate-600">No pudimos encontrar este debate en los datos de prueba.</p><button type="button" onClick={() => router.push("/app/conversar")} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Volver a Conversar</button></article></section>;
  }

  if (conversation.type !== "debate") {
    return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-xl font-bold text-slate-900">Esta conversación no es un debate formal</h1><p className="mt-2 text-slate-600">Puedes entrar a la sala general de esta conversación.</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => router.push(`/app/conversar/${conversation.id}`)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Ir a la conversación</button><button type="button" onClick={() => router.push("/app/conversar")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Volver a Conversar</button></div></article></section>;
  }

  const stances = conversation.debateStances?.length ? conversation.debateStances : fallbackStances;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ConversarDebateHeader conversation={conversation} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-4">
          {conversation.status === "waiting" ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-bold text-slate-900">Esperando participantes</h2>
              <p className="mt-2 text-sm text-slate-600">El debate está publicado. La voz se activará cuando haya participantes listos para conversar.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Invitar</button>
                <button type="button" onClick={() => setShareOpen(true)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Compartir enlace</button>
                <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Avisarme cuando empiece</button>
              </div>
            </article>
          ) : null}

          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Posturas del debate</h2>
              <button type="button" onClick={() => setProposeOpen(true)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">+ Proponer postura</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stances.map((stance) => <ConversarDebateStanceColumn key={stance.id} stance={stance} />)}
            </div>
          </article>

          {conversation.status === "live" ? (
            <ConversarDebateControls
              isMicEnabled={isMicEnabled}
              onOpenShareModal={() => setShareOpen(true)}
              onOpenChangeStanceModal={() => setChangeOpen(true)}
              onToggleMic={() => {
                if (!isMicEnabled) {
                  setConsentOpen(true);
                  return;
                }
                setIsMicEnabled(false);
              }}
              onExit={() => router.push("/app/conversar")}
            />
          ) : null}
        </main>

        <ConversarDebateSidePanel conversation={conversation} stances={stances} />
      </div>

      <ConversarConsentModal open={consentOpen} onClose={() => setConsentOpen(false)} onAccept={() => { setConsentOpen(false); setIsMicEnabled(true); }} />
      <ConversarSharedLinkModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <ConversarProposeStanceModal open={proposeOpen} onClose={() => setProposeOpen(false)} />
      <ConversarChangeStanceModal open={changeOpen} onClose={() => setChangeOpen(false)} />
    </section>
  );
}
