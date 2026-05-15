import type { ConversationParticipant } from "@/modules/conversar/types";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function ConversarVoiceParticipants({ participants }: { participants: ConversationParticipant[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => {
        const isHost = participant.status === "host";
        const isSpeaking = participant.status === "speaking";
        const isListening = participant.status === "listening";
        const isHandRaised = participant.status === "handRaised";
        const tone = isSpeaking
          ? "border-emerald-300 bg-emerald-50"
          : isHandRaised
            ? "border-amber-300 bg-amber-50"
            : isListening
              ? "border-sky-200 bg-sky-50"
              : "border-slate-200 bg-slate-50";
        const label = isHost ? "Host" : isSpeaking ? "Hablando" : isHandRaised ? "Mano levantada" : "Escuchando";

        return (
          <article key={participant.id} className={`rounded-2xl border p-3 ${tone}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{initials(participant.user.name)}</div>
              <div>
                <p className="font-semibold text-slate-900">{participant.user.name}</p>
                <p className="text-xs text-slate-600">{label}</p>
              </div>
            </div>
            {isHost ? <span className="mt-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">Anfitrión</span> : null}
          </article>
        );
      })}
    </div>
  );
}
