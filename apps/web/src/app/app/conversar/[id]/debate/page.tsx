"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Hand, Loader2, Mic, MicOff, PhoneOff, Plus, Send } from "lucide-react";
import { useConversationDetail } from "@/hooks/useConversationDetail";
import { useLiveKitConversation } from "@/hooks/useLiveKitConversation";
import {
  fetchStances,
  joinStance,
  createStance,
  createArgument,
  startConversation,
} from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import { ConversarSkeleton, ConversarError } from "@/components/conversar/ConversarStates";
import type { ConversationDebateStance } from "@crunedu/shared";

export default function ConversarDebatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const conversationId = Number(params.id);
  const { conversation, loading, error, refresh } = useConversationDetail(conversationId);
  const [stances, setStances] = useState<ConversationDebateStance[]>([]);
  const [joined, setJoined] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newStanceTitle, setNewStanceTitle] = useState("");
  const [showPropose, setShowPropose] = useState(false);
  const [argumentInputs, setArgumentInputs] = useState<Record<number, string>>({});

  const livekit = useLiveKitConversation({ conversationId, autoJoin: false });
  const canManage = livekit.role === "HOST" || livekit.role === "MODERATOR";

  const loadStances = useCallback(async () => {
    try {
      const data = await fetchStances(conversationId);
      setStances(data);
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversation) loadStances();
  }, [conversation, loadStances]);

  const handleJoin = useCallback(async () => {
    setActionError(null);
    try {
      await livekit.join();
      setJoined(true);
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo entrar al debate."));
    }
  }, [livekit]);

  const handleJoinStance = useCallback(async (stanceId: number) => {
    setActionError(null);
    try {
      const updated = await joinStance(conversationId, stanceId);
      setStances(updated);
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo unir a la postura."));
    }
  }, [conversationId]);

  const handleCreateStance = useCallback(async () => {
    if (!newStanceTitle.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      await createStance(conversationId, newStanceTitle.trim());
      setNewStanceTitle("");
      setShowPropose(false);
      await loadStances();
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo crear la postura."));
    } finally {
      setBusy(false);
    }
  }, [conversationId, newStanceTitle, loadStances]);

  const handleCreateArgument = useCallback(async (stanceId: number) => {
    const content = argumentInputs[stanceId]?.trim();
    if (!content) return;
    setActionError(null);
    try {
      await createArgument(conversationId, stanceId, content);
      setArgumentInputs((prev) => ({ ...prev, [stanceId]: "" }));
      await loadStances();
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo publicar el argumento."));
    }
  }, [conversationId, argumentInputs, loadStances]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await startConversation(conversationId);
      await refresh();
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo iniciar el debate."));
    } finally {
      setBusy(false);
    }
  }, [conversationId, refresh]);

  if (loading) return <section className="mx-auto max-w-3xl px-4 py-8"><ConversarSkeleton /></section>;
  if (error || !conversation) return <section className="mx-auto max-w-3xl px-4 py-8"><ConversarError message={error ?? "Debate no encontrado."} onRetry={refresh} /><Link href="/app/conversar" className="mt-4 inline-block text-sm font-semibold text-indigo-700">← Volver</Link></section>;
  if (conversation.type !== "DEBATE") return <section className="mx-auto max-w-3xl px-4 py-8"><article className="rounded-3xl border border-slate-200 bg-white p-6"><h1 className="text-xl font-bold text-slate-900">Esta conversación no es un debate</h1><Link href={`/app/conversar/${conversation.id}`} className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Ir a la conversación</Link></article></section>;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-white via-violet-50/40 to-indigo-50/30 p-5">
        <Link href="/app/conversar" className="text-sm font-semibold text-indigo-700">← Volver a Conversar</Link>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{conversation.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          {conversation.status === "LIVE" ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">En vivo</span> : null}
          {conversation.status === "WAITING" ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">En espera</span> : null}
          {conversation.isRecording ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">Grabando</span> : null}
        </div>
      </div>

      {actionError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{actionError}</div> : null}

      {!joined && conversation.status === "WAITING" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Esperando participantes</h2>
          <p className="mt-2 text-sm text-slate-600">El debate está publicado. Entra para participar.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={handleJoin} className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">Entrar al debate</button>
            {(conversation.isMine || canManage) ? (
              <button type="button" onClick={handleStart} disabled={busy} className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy ? <Loader2 size={16} className="mr-2 animate-spin" /> : null} Iniciar debate
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!joined && conversation.status === "LIVE" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <h2 className="text-lg font-bold text-emerald-900">Debate en vivo</h2>
          <button type="button" onClick={handleJoin} className="mt-3 inline-flex h-12 items-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700">Entrar</button>
        </div>
      ) : null}

      {/* Stances */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Posturas del debate</h2>
          {conversation.allowNewStances ? (
            <button type="button" onClick={() => setShowPropose(!showPropose)} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Proponer postura
            </button>
          ) : null}
        </div>

        {showPropose ? (
          <div className="mb-4 flex gap-2">
            <input value={newStanceTitle} onChange={(e) => setNewStanceTitle(e.target.value)} placeholder="Título de la postura" className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm" />
            <button type="button" onClick={handleCreateStance} disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Crear</button>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stances.map((stance) => (
            <div key={stance.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-900">{stance.title}</h3>
              {stance.description ? <p className="mt-1 text-sm text-slate-600">{stance.description}</p> : null}
              <p className="mt-2 text-xs text-slate-500">{stance.participants} participantes · {stance.argumentsCount} argumentos</p>
              <button type="button" onClick={() => handleJoinStance(stance.id)} className="mt-3 w-full rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Unirme a esta postura</button>
              <div className="mt-3 space-y-2">
                {stance.arguments.map((arg) => (
                  <div key={arg.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                    <p className="text-slate-700">{arg.content}</p>
                    <p className="mt-1 text-xs text-slate-400">— {arg.author.name}</p>
                  </div>
                ))}
              </div>
              {joined ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={argumentInputs[stance.id] ?? ""}
                    onChange={(e) => setArgumentInputs((prev) => ({ ...prev, [stance.id]: e.target.value }))}
                    placeholder="Tu argumento..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => handleCreateArgument(stance.id)} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-800">
                    <Send size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Live controls */}
      {joined ? (
        <div className="sticky bottom-4 z-10 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          {livekit.canPublish ? (
            <button type="button" onClick={livekit.toggleMic} aria-label="Micrófono" className={`flex h-14 w-14 items-center justify-center rounded-full text-white ${livekit.isMicEnabled ? "bg-emerald-600" : "bg-slate-600"}`}>
              {livekit.isMicEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
          ) : (
            <button type="button" onClick={() => {}} aria-label="Levantar mano" className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Hand size={22} />
            </button>
          )}
          <button type="button" onClick={() => { livekit.leave(); setJoined(false); router.push("/app/conversar"); }} aria-label="Salir" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700">
            <PhoneOff size={22} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
