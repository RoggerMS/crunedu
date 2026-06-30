"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { createConversation, createDraft } from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import type { ConversationType, ConversationVisibility } from "@crunedu/shared";

type ConversationTypeValue = "open" | "study" | "question" | "debate";

const conversationTypeOptions: Array<{ value: ConversationTypeValue; title: string; description: string }> = [
  { value: "open", title: "Conversación abierta", description: "Para hablar libremente sobre un tema, compartir ideas u opiniones." },
  { value: "study", title: "Sala de estudio", description: "Para resolver dudas, practicar ejercicios o estudiar con otros." },
  { value: "question", title: "Pregunta para conversar", description: "Para iniciar una conversación desde una pregunta abierta." },
  { value: "debate", title: "Debate formal", description: "Para conversar con posturas, argumentos y turnos más ordenados." },
];

const CATEGORIES = ["Matemática", "Historia", "Física", "Programación", "Inglés", "Filosofía", "Tecnología / Educación", "Vida universitaria", "Otro"];

export default function ConversarNuevaPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [conversationType, setConversationType] = useState<ConversationTypeValue>("open");
  const [visibility, setVisibility] = useState<"public" | "university" | "private">("public");
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [maxSpeakers, setMaxSpeakers] = useState(5);
  const [allowListeners, setAllowListeners] = useState(true);
  const [allowRaiseHand, setAllowRaiseHand] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [rules, setRules] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [initialLinkUrl, setInitialLinkUrl] = useState("");
  const [allowNewStances, setAllowNewStances] = useState(true);
  const [stances, setStances] = useState<Array<{ title: string; description: string }>>([
    { title: "A favor", description: "" },
    { title: "En contra", description: "" },
  ]);
  const [startNow, setStartNow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (title.trim().length < 5) return "El título debe tener al menos 5 caracteres.";
    if (title.trim().length > 140) return "El título no puede exceder 140 caracteres.";
    if (description.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
    if (description.trim().length > 1500) return "La descripción no puede exceder 1500 caracteres.";
    if (!category) return "Selecciona una categoría.";
    if (maxParticipants < 2 || maxParticipants > 200) return "El máximo de participantes debe estar entre 2 y 200.";
    if (maxSpeakers < 1 || maxSpeakers > 25) return "El máximo de hablantes debe estar entre 1 y 25.";
    if (maxSpeakers > maxParticipants) return "El máximo de hablantes no puede superar el máximo de participantes.";
    if (conversationType === "debate" && stances.filter((s) => s.title.trim()).length < 2) {
      return "Un debate necesita al menos dos posturas iniciales.";
    }
    if (initialLinkUrl && !initialLinkUrl.startsWith("https://") && !initialLinkUrl.startsWith("http://")) {
      return "El enlace debe comenzar con http:// o https://";
    }
    return null;
  }

  function buildPayload(isDraft: boolean) {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    return {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      course: course.trim() || undefined,
      rules: rules.trim() || undefined,
      type: conversationType.toUpperCase() as ConversationType,
      visibility: visibility.toUpperCase() as ConversationVisibility,
      maxParticipants,
      maxSpeakers,
      allowListeners,
      allowRaiseHand,
      recordingEnabled,
      allowNewStances,
      tags,
      startNow: isDraft ? false : startNow,
      initialStances: conversationType === "debate" ? stances.filter((s) => s.title.trim()).map((s) => ({ title: s.title.trim(), description: s.description.trim() || undefined })) : undefined,
      initialLinkUrl: initialLinkUrl.trim() || undefined,
    };
  }

  async function handleCreate() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createConversation(buildPayload(false));
      router.push(startNow ? `/app/conversar/${result.id}` : `/app/conversar/${result.id}`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear la conversación."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    setError(null);
    try {
      const result = await createDraft(buildPayload(true));
      router.push(`/app/conversar/${result.id}`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo guardar el borrador."));
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 sm:p-6">
        <Link href="/app/conversar" className="inline-flex text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          ← Volver a Conversar
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Crear conversación</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Crea una conversación de audio para hablar, estudiar, resolver dudas o debatir.</p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Información básica</h2>
        <div className="mt-4 grid gap-4">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Título de la conversación *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Ej. Repaso de proposiciones lógicas" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Descripción breve *</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Explica de qué trata la conversación y qué esperas lograr." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Categoría *</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                <option value="" disabled>Selecciona una categoría</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Curso (opcional)</span>
              <input value={course} onChange={(e) => setCourse(e.target.value)} maxLength={120} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Ej. Lógica Matemática" />
            </label>
          </div>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Etiquetas (separadas por comas, máximo 8)</span>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="lógica, cachimbos, parcial" />
          </label>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Tipo de conversación *</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {conversationTypeOptions.map((option) => (
            <button key={option.value} type="button" onClick={() => setConversationType(option.value)} className={`rounded-2xl border p-4 text-left transition ${conversationType === option.value ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300"}`}>
              <p className="text-sm font-bold text-slate-900">{option.title}</p>
              <p className="mt-1 text-sm text-slate-600">{option.description}</p>
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Participación</h2>
        <div className="mt-4 grid gap-4">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Alcance *</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "university" | "private")} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
              <option value="public">Pública — visible para todos</option>
              <option value="university">Solo mi universidad</option>
              <option value="private">Privada por invitación</option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Máximo de participantes</span>
              <input type="number" min={2} max={200} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Máximo de hablantes</span>
              <input type="number" min={1} max={25} value={maxSpeakers} onChange={(e) => setMaxSpeakers(Number(e.target.value))} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </label>
          </div>
          <p className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            Consejo: define pocos hablantes para mantener ordenada la sala. El número de hablantes nunca debe superar el total de participantes.
          </p>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <span>Permitir oyentes</span>
            <input type="checkbox" checked={allowListeners} onChange={() => setAllowListeners((v) => !v)} className="h-5 w-5 accent-indigo-600" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <span>Permitir levantar la mano</span>
            <input type="checkbox" checked={allowRaiseHand} onChange={() => setAllowRaiseHand((v) => !v)} className="h-5 w-5 accent-indigo-600" />
          </label>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Grabación (opcional)</h2>
        <label className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>Grabar esta conversación</span>
          <input type="checkbox" checked={recordingEnabled} onChange={() => setRecordingEnabled((v) => !v)} className="h-5 w-5 accent-indigo-600" />
        </label>
        <p className="mt-2 text-sm text-slate-500">
          La grabación está desactivada por defecto. Si la activas, los participantes deberán aceptar antes de hablar.
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Enlace externo opcional</h2>
        <input value={initialLinkUrl} onChange={(e) => setInitialLinkUrl(e.target.value)} className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="https://..." />
        <p className="mt-2 text-sm text-slate-500">Puedes agregar un enlace de Meet, Zoom, Discord o un recurso externo.</p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Reglas rápidas</h2>
        <textarea value={rules} onChange={(e) => setRules(e.target.value)} maxLength={2000} className="mt-4 min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Ej. Respeta los turnos, escucha con atención y aporta con respeto." />
      </article>

      {conversationType === "debate" ? (
        <article className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Posturas iniciales</h2>
          <div className="mt-4 grid gap-3">
            {stances.map((stance, i) => (
              <div key={i} className="flex gap-2">
                <input value={stance.title} onChange={(e) => setStances((prev) => prev.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s))} className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" placeholder={`Postura ${i + 1}`} />
                {stances.length > 2 ? (
                  <button type="button" onClick={() => setStances((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500 hover:bg-slate-50">Quitar</button>
                ) : null}
              </div>
            ))}
            {stances.length < 8 ? (
              <SecondaryButton type="button" onClick={() => setStances((prev) => [...prev, { title: "", description: "" }])}>+ Agregar postura</SecondaryButton>
            ) : null}
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Permitir que otros propongan nuevas posturas</span>
              <input type="checkbox" checked={allowNewStances} onChange={() => setAllowNewStances((v) => !v)} className="h-5 w-5 accent-indigo-600" />
            </label>
          </div>
        </article>
      ) : null}

      <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Iniciar</h2>
        <label className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>Iniciar la conversación ahora (si no, quedará en espera)</span>
          <input type="checkbox" checked={startNow} onChange={() => setStartNow((v) => !v)} className="h-5 w-5 accent-indigo-600" />
        </label>
      </article>

      <footer className="flex flex-wrap justify-end gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <SecondaryButton type="button" onClick={() => router.push("/app/conversar")}>Cancelar</SecondaryButton>
        <SecondaryButton type="button" onClick={handleSaveDraft} disabled={savingDraft}>
          {savingDraft ? <Loader2 className="animate-spin" size={16} /> : null} Guardar borrador
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleCreate} disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null} Crear conversación
        </PrimaryButton>
      </footer>
    </section>
  );
}
