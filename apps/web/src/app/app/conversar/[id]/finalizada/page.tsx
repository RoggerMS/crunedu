"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ConversarAudioPlayerMock } from "@/components/conversar/ConversarAudioPlayerMock";
import { ConversarFinishedDebateSummary } from "@/components/conversar/ConversarFinishedDebateSummary";
import { ConversarFinishedHeader } from "@/components/conversar/ConversarFinishedHeader";
import { ConversarFinishedLinks } from "@/components/conversar/ConversarFinishedLinks";
import { ConversarFinishedMaterials } from "@/components/conversar/ConversarFinishedMaterials";
import { ConversarFinishedParticipants } from "@/components/conversar/ConversarFinishedParticipants";
import { ConversarFinishedRightRail } from "@/components/conversar/ConversarFinishedRightRail";
import { ConversarFinishedSummary } from "@/components/conversar/ConversarFinishedSummary";
import { mockConversations } from "@/modules/conversar/mock-data";

export default function ConversarFinishedPage({ params }: { params: { id: string } }) {
  const conversation = useMemo(() => mockConversations.find((item) => item.id === params.id), [params.id]);
  if (!conversation) return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><h1 className="text-xl font-bold text-slate-900">Conversación no encontrada</h1><p className="mt-2 text-slate-600">No pudimos encontrar esta conversación finalizada en los datos de prueba.</p><Link href="/app/conversar" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Volver a Conversar</Link></article></section>;

  const relatedConversations = mockConversations.filter((item) => item.id !== conversation.id && item.category === conversation.category).slice(0, 3);
  const availableRecordings = mockConversations.filter((item) => item.id !== conversation.id && item.recording?.status === "available").slice(0, 3);
  const topicRecommendations = getTopicRecommendations(conversation.category);

  return <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><ConversarFinishedHeader conversation={conversation} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><main className="space-y-5"><ConversarAudioPlayerMock durationLabel={conversation.recording?.durationLabel ?? "42 min"} /><ConversarFinishedSummary conversationType={conversation.type} /><ConversarFinishedMaterials materials={conversation.materials} /><ConversarFinishedLinks sharedLinks={conversation.sharedLinks} /><ConversarFinishedParticipants participants={conversation.participants} />{conversation.type === "debate" ? <ConversarFinishedDebateSummary debateStances={conversation.debateStances} /> : null}<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold text-slate-900">¿Quieres continuar este tema?</h2><p className="mt-2 text-sm text-slate-600">Puedes crear una nueva conversación relacionada para seguir estudiando o debatiendo con otros estudiantes.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/app/conversar/nueva" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Crear conversación relacionada</Link><button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Guardar en mi historial</button><button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Compartir</button><button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Reportar conversación</button></div></article></main><ConversarFinishedRightRail relatedConversations={relatedConversations} topicRecommendations={topicRecommendations} availableRecordings={availableRecordings} /></div></section>;
}

function getTopicRecommendations(category: string) {
  if (category.includes("Matemática")) return ["Lógica proposicional", "Tablas de verdad", "Implicación lógica", "Técnicas de estudio", "IA y educación"];
  if (category.includes("Tecnología")) return ["IA y educación", "Ética académica", "Aprendizaje activo", "Pensamiento crítico", "Trabajo colaborativo"];
  return ["Técnicas de estudio", "Organización semanal", "Aprendizaje colaborativo", "Recursos confiables", "Preparación de parciales"];
}
