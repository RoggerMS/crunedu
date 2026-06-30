"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConversationDetail } from "@/hooks/useConversationDetail";
import { ConversarSkeleton, ConversarError } from "@/components/conversar/ConversarStates";
import { ConversarAudioPlayer } from "@/components/conversar/ConversarAudioPlayer";
import { fetchRecording, getMaterialUrl } from "@/lib/conversations-api";

export default function ConversarFinishedPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const conversationId = Number(params.id);
  const { conversation, loading, error, refresh } = useConversationDetail(conversationId);

  if (loading) return <section className="mx-auto max-w-3xl px-4 py-8"><ConversarSkeleton /></section>;
  if (error || !conversation) return <section className="mx-auto max-w-3xl px-4 py-8"><ConversarError message={error ?? "Conversación no encontrada."} onRetry={refresh} /><Link href="/app/conversar" className="mt-4 inline-block text-sm font-semibold text-indigo-700">← Volver a Conversar</Link></section>;

  const isCancelled = conversation.status === "CANCELLED";
  const durationLabel = conversation.startedAt && conversation.endedAt
    ? `${Math.round((new Date(conversation.endedAt).getTime() - new Date(conversation.startedAt).getTime()) / 60000)} min`
    : "—";
  const availableRecording = conversation.recordings.find((r) => r.status === "AVAILABLE");

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Link href="/app/conversar" className="text-sm font-semibold text-indigo-700">← Volver a Conversar</Link>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${isCancelled ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
            {isCancelled ? "Cancelada" : "Finalizada"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{conversation.type.toLowerCase()}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{conversation.visibility.toLowerCase()}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{conversation.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Anfitrión</p>
            <p className="font-semibold text-slate-700">{conversation.createdBy.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Duración</p>
            <p className="font-semibold text-slate-700">{durationLabel}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Inicio</p>
            <p className="font-semibold text-slate-700">{conversation.startedAt ? new Date(conversation.startedAt).toLocaleString("es-PE") : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Fin</p>
            <p className="font-semibold text-slate-700">{conversation.endedAt ? new Date(conversation.endedAt).toLocaleString("es-PE") : "—"}</p>
          </div>
        </div>
      </div>

      {isCancelled ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Esta conversación fue cancelada por el anfitrión.
        </div>
      ) : null}

      {conversation.type === "QUESTION" && conversation.conclusion ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h2 className="text-sm font-bold text-indigo-900">Conclusión</h2>
          <p className="mt-2 text-sm text-indigo-800">{conversation.conclusion}</p>
        </div>
      ) : null}

      {availableRecording ? (
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900">Grabación</h2>
          {availableRecording.id && conversation.recordings.length > 0 ? (
            <ConversarAudioPlayer
              src={getMaterialUrl(`/conversations/recordings/${availableRecording.id}`)}
              title={conversation.title}
              durationSeconds={availableRecording.durationSeconds}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              La grabación está siendo procesada. Vuelve más tarde.
            </div>
          )}
        </div>
      ) : conversation.isRecording ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          La grabación está siendo procesada. Vuelve más tarde para escucharla.
        </div>
      ) : null}

      {conversation.materials.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Materiales</h2>
          <div className="space-y-1">
            {conversation.materials.map((m) => (
              <a key={m.id} href={`/api/conversations/media/${m.fileUrl.split("/").pop()}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                {m.title} ({Math.round(m.sizeBytes / 1024)} KB)
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {conversation.links.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Enlaces</h2>
          <div className="space-y-1">
            {conversation.links.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50">
                {l.title} <span className="text-slate-400">· {l.domain}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {conversation.type === "DEBATE" && conversation.debateStances.length > 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Posturas del debate</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {conversation.debateStances.map((s) => (
              <div key={s.id} className="rounded-lg bg-white p-3 text-sm">
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">{s.participants} participantes · {s.argumentsCount} argumentos</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">¿Quieres continuar este tema?</h2>
        <p className="mt-2 text-sm text-slate-600">Crea una nueva conversación relacionada para seguir conversando.</p>
        <Link href="/app/conversar/nueva" className="mt-3 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Crear conversación relacionada</Link>
      </div>
    </section>
  );
}
