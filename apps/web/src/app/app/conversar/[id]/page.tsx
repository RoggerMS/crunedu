"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Hand,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Settings,
  Users,
  Volume2,
} from "lucide-react";
import { useConversationDetail } from "@/hooks/useConversationDetail";
import { useLiveKitConversation } from "@/hooks/useLiveKitConversation";
import {
  raiseHand,
  cancelRaiseHand,
  fetchSpeakerRequests,
  approveSpeakerRequest,
  rejectSpeakerRequest,
  startConversation,
  endConversation,
  subscribeToStart,
  unsubscribeFromStart,
} from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import { ConversarSkeleton, ConversarError } from "@/components/conversar/ConversarStates";
import type { ConversationSpeakerRequest } from "@crunedu/shared";

export default function ConversarRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const conversationId = Number(params.id);
  const { conversation, loading, error, refresh } = useConversationDetail(conversationId);
  const [joined, setJoined] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [speakerRequests, setSpeakerRequests] = useState<ConversationSpeakerRequest[]>([]);
  const [busy, setBusy] = useState(false);

  const livekit = useLiveKitConversation({ conversationId, autoJoin: false });

  const isHost = livekit.role === "HOST";
  const canManage = livekit.role === "HOST" || livekit.role === "MODERATOR";

  const handleJoin = useCallback(async () => {
    setActionError(null);
    try {
      await livekit.join();
      setJoined(true);
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo entrar a la conversación."));
    }
  }, [livekit]);

  const handleLeave = useCallback(async () => {
    await livekit.leave();
    setJoined(false);
    router.push("/app/conversar");
  }, [livekit, router]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await startConversation(conversationId);
      await refresh();
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo iniciar la conversación."));
    } finally {
      setBusy(false);
    }
  }, [conversationId, refresh]);

  const handleEnd = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await endConversation(conversationId);
      await livekit.leave();
      router.push(`/app/conversar/${conversationId}/finalizada`);
    } catch (err) {
      setActionError(mapApiError(err, "No se pudo finalizar la conversación."));
    } finally {
      setBusy(false);
    }
  }, [conversationId, livekit, router]);

  const handleRaiseHand = useCallback(async () => {
    setActionError(null);
    if (handRaised) {
      try {
        await cancelRaiseHand(conversationId);
        setHandRaised(false);
      } catch (err) {
        setActionError(mapApiError(err, "No se pudo cancelar la solicitud."));
      }
    } else {
      try {
        await raiseHand(conversationId);
        setHandRaised(true);
      } catch (err) {
        setActionError(mapApiError(err, "No se pudo levantar la mano."));
      }
    }
  }, [conversationId, handRaised]);

  const handleSubscribe = useCallback(async () => {
    setActionError(null);
    if (subscribed) {
      try {
        await unsubscribeFromStart(conversationId);
        setSubscribed(false);
      } catch (err) {
        setActionError(mapApiError(err, "No se pudo cancelar el aviso."));
      }
    } else {
      try {
        await subscribeToStart(conversationId);
        setSubscribed(true);
      } catch (err) {
        setActionError(mapApiError(err, "No se pudo activar el aviso."));
      }
    }
  }, [conversationId, subscribed]);

  // Poll speaker requests for host/moderator
  useEffect(() => {
    if (!joined || !canManage || conversation?.status !== "LIVE") return;
    const interval = setInterval(async () => {
      try {
        const reqs = await fetchSpeakerRequests(conversationId);
        setSpeakerRequests(reqs);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [joined, canManage, conversationId, conversation?.status]);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <ConversarSkeleton />
      </section>
    );
  }

  if (error || !conversation) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <ConversarError message={error ?? "Conversación no encontrada."} onRetry={refresh} />
        <Link href="/app/conversar" className="mt-4 inline-block text-sm font-semibold text-indigo-700">← Volver a Conversar</Link>
      </section>
    );
  }

  if (conversation.type === "DEBATE" && (conversation.status === "LIVE" || conversation.status === "WAITING")) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">Esta conversación es un debate formal</h1>
          <p className="mt-2 text-slate-600">La vista especial de debate está disponible para organizar posturas y argumentos.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/app/conversar/${conversation.id}/debate`} className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Entrar al debate</Link>
            <Link href="/app/conversar" className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Volver a Conversar</Link>
          </div>
        </article>
      </section>
    );
  }

  if (conversation.status === "ENDED" || conversation.status === "CANCELLED") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">Conversación finalizada</h1>
          <p className="mt-2 text-slate-600">Esta conversación ya no está disponible.</p>
          <Link href={`/app/conversar/${conversation.id}/finalizada`} className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Ver resumen</Link>
        </article>
      </section>
    );
  }

  const connectionLabel =
    livekit.connectionState === "connecting" ? "Conectando..."
    : livekit.connectionState === "reconnecting" ? "Reconectando..."
    : livekit.connectionState === "connected" ? "Conectado"
    : livekit.connectionState === "failed" ? "Error de conexión"
    : "Desconectado";

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {conversation.status === "LIVE" ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700"><Radio size={12} /> En vivo</span> : null}
              {conversation.status === "WAITING" ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">En espera</span> : null}
              {conversation.isRecording ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">Grabando</span> : null}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{conversation.type.toLowerCase()}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{conversation.visibility.toLowerCase()}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-900">{conversation.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{conversation.category}{conversation.course ? ` · ${conversation.course}` : ""}</p>
            <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
          </div>
          <Link href="/app/conversar" className="text-sm font-semibold text-indigo-700">← Volver</Link>
        </div>
        {joined ? (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              livekit.connectionState === "connected" ? "bg-emerald-100 text-emerald-700" :
              livekit.connectionState === "failed" ? "bg-rose-100 text-rose-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                livekit.connectionState === "connected" ? "bg-emerald-500" :
                livekit.connectionState === "failed" ? "bg-rose-500" : "bg-amber-500 animate-pulse"
              }`} />
              {connectionLabel}
            </span>
            <span className="text-xs text-slate-500">{livekit.participants.length} participantes</span>
          </div>
        ) : null}
      </div>

      {actionError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{actionError}</div> : null}

      {livekit.error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Error de audio: {livekit.error}</div> : null}

      {/* Waiting state */}
      {!joined && conversation.status === "WAITING" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Esperando participantes</h2>
          <p className="mt-2 text-sm text-slate-600">La conversación está publicada. Entra y comparte el enlace para que más personas se unan.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={handleJoin} className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">
              <Volume2 size={18} className="mr-2" /> Entrar a la sala
            </button>
            <button type="button" onClick={handleSubscribe} className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {subscribed ? "Te avisaremos cuando empiece" : "Avisarme cuando empiece"}
            </button>
            {isHost || conversation.isMine ? (
              <button type="button" onClick={handleStart} disabled={busy} className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Radio size={18} className="mr-2" />} Iniciar ahora
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Join button for live conversations */}
      {!joined && conversation.status === "LIVE" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <Radio className="mx-auto mb-2 text-emerald-600" size={32} />
          <h2 className="text-lg font-bold text-emerald-900">Conversación en vivo</h2>
          <p className="mt-1 text-sm text-emerald-700">Entra para escuchar y participar.</p>
          <button type="button" onClick={handleJoin} className="mt-4 inline-flex h-12 items-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700">
            <Volume2 size={18} className="mr-2" /> Entrar
          </button>
        </div>
      ) : null}

      {/* Recording consent for live with recording */}
      {!joined && conversation.status === "LIVE" && conversation.isRecording ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Esta conversación está siendo grabada. Al entrar aceptas que tu audio pueda ser grabado si hablas.
        </div>
      ) : null}

      {/* Connected room */}
      {joined ? (
        <>
          {/* Participants */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users size={16} /> Participantes ({livekit.participants.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {livekit.participants.map((p) => (
                <div key={p.identity} className={`flex items-center gap-3 rounded-xl border p-3 ${
                  livekit.activeSpeakerId === p.identity ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {p.name}{p.isLocal ? " (tú)" : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.role === "HOST" ? "Anfitrión" : p.role === "MODERATOR" ? "Moderador" : p.role === "SPEAKER" ? "Hablante" : "Oyente"}
                      {p.isSpeaking ? " · hablando" : ""}
                    </p>
                  </div>
                  {p.hasMic ? (
                    p.isMicEnabled ? <Mic size={16} className="text-emerald-600" /> : <MicOff size={16} className="text-slate-400" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Speaker requests for host/moderator */}
          {canManage && speakerRequests.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-bold text-amber-900">Solicitudes para hablar ({speakerRequests.length})</h2>
              <div className="mt-3 space-y-2">
                {speakerRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-xl bg-white p-3">
                    <span className="text-sm font-semibold text-slate-900">{req.user.name}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => approveSpeakerRequest(conversationId, req.id).then(refresh)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Aprobar</button>
                      <button type="button" onClick={() => rejectSpeakerRequest(conversationId, req.id).then(refresh)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Materials and links */}
          {conversation.materials.length > 0 || conversation.links.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-slate-900">Materiales y enlaces</h2>
              {conversation.materials.length > 0 ? (
                <div className="space-y-1">
                  {conversation.materials.map((m) => (
                    <a key={m.id} href={`/api/conversations/media/${m.fileUrl.split("/").pop()}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      {m.title} ({Math.round(m.sizeBytes / 1024)} KB)
                    </a>
                  ))}
                </div>
              ) : null}
              {conversation.links.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {conversation.links.map((l) => (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50">
                      {l.title} <span className="text-slate-400">· {l.domain}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Bottom controls */}
          <div className="sticky bottom-4 z-10 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            {livekit.canPublish ? (
              <button
                type="button"
                onClick={livekit.toggleMic}
                aria-label={livekit.isMicEnabled ? "Silenciar micrófono" : "Activar micrófono"}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition ${
                  livekit.isMicEnabled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                {livekit.isMicEnabled ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRaiseHand}
                aria-label={handRaised ? "Bajar la mano" : "Levantar la mano"}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition ${
                  handRaised ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <Hand size={22} />
              </button>
            )}
            <button
              type="button"
              onClick={handleLeave}
              aria-label="Salir"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700"
            >
              <PhoneOff size={22} />
            </button>
            {canManage && conversation.status === "LIVE" ? (
              <button
                type="button"
                onClick={handleEnd}
                disabled={busy}
                aria-label="Finalizar conversación"
                className="flex h-14 items-center rounded-full bg-slate-800 px-5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Finalizar"}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
