"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

type ConversationType = "open" | "study" | "question" | "debate";

const conversationTypeOptions: Array<{ value: ConversationType; title: string; description: string }> = [
  {
    value: "open",
    title: "Conversación abierta",
    description: "Para hablar libremente sobre un tema, compartir ideas u opiniones.",
  },
  {
    value: "study",
    title: "Sala de estudio",
    description: "Para resolver dudas, practicar ejercicios o estudiar con otros.",
  },
  {
    value: "question",
    title: "Pregunta para conversar",
    description: "Para iniciar una conversación desde una pregunta abierta.",
  },
  {
    value: "debate",
    title: "Debate formal",
    description: "Para conversar con posturas, argumentos y turnos más ordenados.",
  },
];

export default function ConversarNuevaPage() {
  const router = useRouter();
  const [conversationType, setConversationType] = useState<ConversationType>("open");
  const [allowListeners, setAllowListeners] = useState(true);
  const [allowRaiseHand, setAllowRaiseHand] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [allowNewPositions, setAllowNewPositions] = useState(true);
  const [showLocalMessage, setShowLocalMessage] = useState(false);

  const handleFakeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowLocalMessage(true);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href="/app/conversar" className="inline-flex text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
              ← Volver a Conversar
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Crear conversación</h1>
              <p className="text-sm text-slate-600 sm:text-base">
                Crea una conversación para hablar, estudiar, resolver dudas o compartir ideas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <SecondaryButton type="button" disabled>
              Guardar borrador
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => setShowLocalMessage(true)}>
              Crear conversación
            </PrimaryButton>
          </div>
        </div>
      </header>

      <form onSubmit={handleFakeSubmit} className="space-y-6">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Información básica</h2>
          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Título de la conversación *</span>
              <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Ej. No entiendo proposiciones lógicas" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Descripción breve *</span>
              <textarea className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Explica de qué trata la conversación y qué esperas lograr." />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Categoría o curso *</span>
              <select className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" defaultValue="">
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                <option>Matemática</option>
                <option>Historia</option>
                <option>Física</option>
                <option>Programación</option>
                <option>Inglés</option>
                <option>Filosofía</option>
                <option>Tecnología / Educación</option>
                <option>Vida universitaria</option>
                <option>Otro</option>
              </select>
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Tipo de conversación *</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {conversationTypeOptions.map((option) => {
              const isActive = conversationType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setConversationType(option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isActive ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{option.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                </button>
              );
            })}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Participación</h2>
          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Alcance *</span>
              <select className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" defaultValue="Pública">
                <option>Pública</option>
                <option>Solo mi universidad</option>
                <option>Privada por invitación</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Cantidad máxima de participantes</span>
              <input type="number" min={2} defaultValue={20} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Permitir oyentes</span>
              <input type="checkbox" checked={allowListeners} onChange={() => setAllowListeners((value) => !value)} className="h-5 w-5 accent-indigo-600" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Permitir levantar la mano</span>
              <input type="checkbox" checked={allowRaiseHand} onChange={() => setAllowRaiseHand((value) => !value)} className="h-5 w-5 accent-indigo-600" />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Voz y grabación</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Activar voz cuando haya participantes</span>
              <input type="checkbox" checked={voiceEnabled} onChange={() => setVoiceEnabled((value) => !value)} className="h-5 w-5 accent-indigo-600" />
            </label>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              Todas las conversaciones de voz quedan grabadas. Los participantes deberán aceptar esta condición antes de hablar.
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Enlace externo opcional</h2>
          <div className="mt-4 space-y-2">
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="https://..." />
            <p className="text-sm text-slate-600">
              Puedes agregar un enlace de Meet, Zoom, Discord, documento o recurso externo si ya lo tienes. También podrás compartirlo después dentro de la conversación.
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Material inicial</h2>
          <button type="button" className="mt-4 flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50">
            <span className="text-sm font-semibold text-slate-800">Arrastra archivos aquí o haz clic para subir</span>
            <span className="mt-1 text-xs text-slate-500">PDF, DOCX, PPTX o imagen</span>
          </button>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Reglas rápidas</h2>
          <textarea className="mt-4 min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Ej. Respeta los turnos, escucha con atención y aporta con respeto." />
        </article>

        {conversationType === "debate" && (
          <article className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 shadow-soft sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Posturas iniciales</h2>
            <div className="mt-4 grid gap-3">
              <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" defaultValue="A favor" />
              <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" defaultValue="En contra" />
              <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" defaultValue="Depende del uso" />
              <SecondaryButton type="button" className="justify-center sm:justify-start" disabled>
                + Agregar postura
              </SecondaryButton>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <span>Permitir que otros propongan nuevas posturas</span>
                <input type="checkbox" checked={allowNewPositions} onChange={() => setAllowNewPositions((value) => !value)} className="h-5 w-5 accent-indigo-600" />
              </label>
            </div>
          </article>
        )}

        <footer className="flex flex-wrap justify-end gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <SecondaryButton type="button" onClick={() => router.push("/app/conversar")}>
            Cancelar
          </SecondaryButton>
          <SecondaryButton type="button" disabled>
            Guardar borrador
          </SecondaryButton>
          <PrimaryButton type="submit">Crear conversación</PrimaryButton>
        </footer>

        {showLocalMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            La creación real se conectará más adelante.
          </div>
        )}
      </form>
    </section>
  );
}
