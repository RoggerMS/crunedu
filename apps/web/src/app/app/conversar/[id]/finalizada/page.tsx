"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { Conversation, ConversationType, RecordingStatus } from "@/modules/conversar/types";

const keyIdeas = [
  "Se aclararon los puntos principales del tema.",
  "Los participantes compartieron ejemplos y recursos.",
  "Quedaron materiales disponibles para revisar después.",
  "La conversación puede retomarse en una nueva sesión relacionada.",
];

export default function ConversarFinishedPage({ params }: { params: { id: string } }) {
  const conversation = useMemo(() => mockConversations.find((item) => item.id === params.id), [params.id]);

  if (!conversation) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-xl font-bold text-slate-900">Conversación no encontrada</h1>
          <p className="mt-2 text-slate-600">No pudimos encontrar esta conversación finalizada en los datos de prueba.</p>
          <Link href="/app/conversar" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Volver a Conversar
          </Link>
        </article>
      </section>
    );
  }

  const relatedConversations = mockConversations
    .filter((item) => item.id !== conversation.id && item.category === conversation.category)
    .slice(0, 3);

  const availableRecordings = mockConversations
    .filter((item) => item.id !== conversation.id && item.recording?.status === "available")
    .slice(0, 3);

  const topicRecommendations = getTopicRecommendations(conversation.category);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <FinishedHeader conversation={conversation} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <AudioPlayerMock durationLabel={conversation.recording?.durationLabel ?? "42 min"} />
          <FinishedSummary conversationType={conversation.type} />

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Materiales compartidos</h2>
            {conversation.materials.length ? (
              <div className="mt-3 space-y-3">
                {conversation.materials.map((material) => (
                  <div key={material.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{material.title}</p>
                    <p className="text-sm text-slate-600">{material.type.toUpperCase()} {material.size ? `· ${material.size}` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Ver</button>
                      <button type="button" className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Guardar</button>
                      {material.url ? <button type="button" className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Descargar</button> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No se compartieron materiales en esta conversación.</p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Enlaces compartidos</h2>
            {conversation.sharedLinks.length ? (
              <div className="mt-3 space-y-3">
                {conversation.sharedLinks.map((link) => (
                  <div key={link.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-900">{link.title}</p>
                    <p className="text-sm text-slate-600">{link.domain} · Compartido por {link.sharedBy.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Abrir</button>
                      <button type="button" className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Reportar</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No se compartieron enlaces en esta conversación.</p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Participantes</h2>
            <div className="mt-3 space-y-2">
              {conversation.participants.map((participant) => {
                const initials = participant.user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials}</div>
                      <div>
                        <p className="font-semibold text-slate-900">{participant.user.name}</p>
                        <p className="text-xs text-slate-600">{participant.user.career ?? participant.user.university ?? "La Cantuta"}</p>
                      </div>
                    </div>
                    {participant.status === "host" ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Anfitrión</span> : null}
                  </div>
                );
              })}
            </div>
          </article>

          {conversation.type === "debate" && conversation.debateStances?.length ? (
            <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-soft">
              <h2 className="text-lg font-bold text-violet-900">Posturas del debate</h2>
              <div className="mt-3 space-y-3">
                {conversation.debateStances.map((stance) => (
                  <div key={stance.id} className="rounded-2xl border border-violet-200 bg-white p-3">
                    <h3 className="font-semibold text-slate-900">{stance.title}</h3>
                    {stance.description ? <p className="mt-1 text-sm text-slate-700">{stance.description}</p> : null}
                    <p className="mt-1 text-xs text-slate-600">Participantes: {stance.participants}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">Argumentos destacados</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {stance.arguments.map((argument) => (
                        <li key={argument.id}>{argument.content}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">¿Quieres continuar este tema?</h2>
            <p className="mt-2 text-sm text-slate-600">Puedes crear una nueva conversación relacionada para seguir estudiando o debatiendo con otros estudiantes.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/app/conversar/nueva" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Crear conversación relacionada</Link>
              <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Guardar en mi historial</button>
              <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Compartir</button>
              <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Reportar conversación</button>
            </div>
          </article>
        </main>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="text-sm font-bold text-slate-900">Conversaciones relacionadas</h3>
            <div className="mt-3 space-y-2">
              {relatedConversations.length ? relatedConversations.map((item) => (
                <Link key={item.id} href={`/app/conversar/${item.id}`} className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.type}</p>
                </Link>
              )) : <p className="text-xs text-slate-600">No hay conversaciones relacionadas por ahora.</p>}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="text-sm font-bold text-slate-900">Temas recomendados</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {topicRecommendations.map((topic) => <li key={topic} className="rounded-xl bg-slate-100 px-3 py-2">{topic}</li>)}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="text-sm font-bold text-slate-900">También podrías escuchar</h3>
            <div className="mt-3 space-y-2">
              {availableRecordings.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.recording?.durationLabel ?? "Duración no disponible"}</p>
                  <Link href={`/app/conversar/${item.id}/finalizada`} className="mt-2 inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                    Ver grabación
                  </Link>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function FinishedHeader({ conversation }: { conversation: Conversation }) {
  const metadata = [conversation.course ?? conversation.category, getConversationTypeLabel(conversation.type), conversation.recording?.durationLabel ? `Duración: ${conversation.recording.durationLabel}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <Link href="/app/conversar" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800">← Volver a Conversar</Link>
      <p className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">Conversación finalizada</p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{conversation.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{metadata}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{getRecordingStatusLabel(conversation.recording?.status)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Reproducir</button>
        <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Guardar</button>
        <Link href="/app/conversar/nueva" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Crear conversación relacionada</Link>
        <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Compartir</button>
      </div>
    </header>
  );
}

function AudioPlayerMock({ durationLabel }: { durationLabel: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState("1x");
  const totalSeconds = parseDurationToSeconds(durationLabel);
  const previewProgress = isPlaying ? 46 : 18;
  const currentSeconds = Math.round((totalSeconds * previewProgress) / 100);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">Grabación de la conversación</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setIsPlaying((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
        <div className="flex flex-1 items-end gap-1 rounded-xl bg-slate-100 p-3">
          {Array.from({ length: 32 }).map((_, index) => (
            <span key={index} className="w-1 rounded-full bg-indigo-500/70" style={{ height: `${8 + ((index * 9) % 24)}px` }} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${previewProgress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>{formatSeconds(currentSeconds)}</span>
          <span>{durationLabel}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        {[
          { label: "1x", value: "1x" },
          { label: "1.25x", value: "1.25x" },
          { label: "1.5x", value: "1.5x" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSpeed(option.value)}
            className={`rounded-lg px-3 py-1.5 font-semibold ${speed === option.value ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Esta conversación fue grabada con aceptación previa de los participantes.</p>
    </article>
  );
}

function FinishedSummary({ conversationType }: { conversationType: ConversationType }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">Resumen de la conversación</h2>
      <p className="mt-2 text-sm text-slate-700">{getSummaryByType(conversationType)}</p>
      <h3 className="mt-4 text-sm font-bold text-slate-900">Ideas clave</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}
      </ul>
    </article>
  );
}

function getConversationTypeLabel(type: ConversationType) {
  if (type === "study") return "Sala de estudio";
  if (type === "question") return "Pregunta";
  if (type === "debate") return "Debate";
  return "Conversación abierta";
}

function getRecordingStatusLabel(status?: RecordingStatus) {
  if (status === "available") return "Grabación disponible";
  if (status === "processing") return "Grabación procesándose";
  if (status === "restricted") return "Grabación restringida";
  return "Grabación no disponible";
}

function getSummaryByType(type: ConversationType) {
  if (type === "study" || type === "question") {
    return "Durante la sesión se explicó el tema principal, se resolvieron dudas y se compartieron ejemplos para reforzar la comprensión.";
  }

  if (type === "debate") {
    return "Durante el debate se organizaron posturas, argumentos y respuestas entre los participantes.";
  }

  return "Durante la conversación se compartieron ideas, puntos de vista y recursos relacionados con el tema.";
}

function getTopicRecommendations(category: string) {
  if (category.includes("Matemática")) {
    return ["Lógica proposicional", "Tablas de verdad", "Implicación lógica", "Técnicas de estudio", "IA y educación"];
  }

  if (category.includes("Tecnología")) {
    return ["IA y educación", "Ética académica", "Aprendizaje activo", "Pensamiento crítico", "Trabajo colaborativo"];
  }

  return ["Técnicas de estudio", "Organización semanal", "Aprendizaje colaborativo", "Recursos confiables", "Preparación de parciales"];
}

function parseDurationToSeconds(durationLabel: string) {
  const matches = durationLabel.match(/(\d+)/);
  const minutes = matches ? Number(matches[1]) : 40;
  return minutes * 60;
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
