"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversarConsentModal } from "@/components/conversar/ConversarConsentModal";
import { ConversarRoomControls } from "@/components/conversar/ConversarRoomControls";
import { ConversarRoomHeader } from "@/components/conversar/ConversarRoomHeader";
import { ConversarRoomSidePanel } from "@/components/conversar/ConversarRoomSidePanel";
import { ConversarSharedLinkModal } from "@/components/conversar/ConversarSharedLinkModal";
import { ConversarVoiceParticipants } from "@/components/conversar/ConversarVoiceParticipants";
import { mockConversations } from "@/modules/conversar/mock-data";

export default function ConversarRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const conversation = useMemo(() => mockConversations.find((item) => item.id === params.id), [params.id]);

  if (!conversation) return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-xl font-bold text-slate-900">Conversación no encontrada</h1><p className="mt-2 text-slate-600">No pudimos encontrar esta conversación en los datos de prueba.</p><button type="button" onClick={() => router.push("/app/conversar")} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Volver a Conversar</button></article></section>;

  if (conversation.type === "debate") return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-xl font-bold text-slate-900">Esta conversación es un debate formal</h1><p className="mt-2 text-slate-600">La vista especial de debate ya está disponible para organizar posturas y argumentos.</p><div className="mt-4 flex flex-wrap gap-2"><Link href={`/app/conversar/${conversation.id}/debate`} className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Entrar al debate</Link><Link href="/app/conversar" className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Volver a Conversar</Link></div></article></section>;

  return <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><ConversarRoomHeader conversation={conversation} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><main className="space-y-4">{conversation.status === "waiting" ? <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-xl font-bold text-slate-900">Esperando participantes</h2><p className="mt-2 text-sm text-slate-600">La conversación está publicada. La voz se activará cuando haya más personas listas para conversar.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Invitar</button><button type="button" onClick={() => setShareOpen(true)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Compartir enlace</button><button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Avisarme cuando empiece</button></div></article> : null}{conversation.status === "live" ? <><article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-3 text-lg font-bold text-slate-900">Participantes por voz</h2><ConversarVoiceParticipants participants={conversation.participants} /></article>{conversation.type === "study" ? <article className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><div><h3 className="text-base font-bold text-emerald-900">Pregunta principal</h3><p className="mt-2 text-sm text-emerald-800">¿Cuál de las siguientes afirmaciones es una proposición?</p><ul className="mt-2 space-y-1 text-sm text-emerald-900"><li>A) Hoy es un buen día para estudiar.</li><li>B) x + 2 = 5</li><li>C) ¿Cómo estás?</li><li>D) Si llueve, entonces la calle está mojada.</li></ul></div><div className="rounded-2xl border border-emerald-200 bg-white p-4"><h4 className="font-semibold text-emerald-900">Notas colaborativas</h4><p className="mt-2 text-sm text-emerald-800">Una proposición es un enunciado que puede ser verdadero o falso.</p></div></article> : null}<ConversarRoomControls isMicEnabled={isMicEnabled} onOpenShareModal={() => setShareOpen(true)} onToggleMic={() => { if (!isMicEnabled) { setConsentOpen(true); return; } setIsMicEnabled(false); }} /></> : null}</main><ConversarRoomSidePanel conversation={conversation} /></div><ConversarConsentModal open={consentOpen} onClose={() => setConsentOpen(false)} onAccept={() => { setConsentOpen(false); setIsMicEnabled(true); }} /><ConversarSharedLinkModal open={shareOpen} onClose={() => setShareOpen(false)} /></section>;
}
