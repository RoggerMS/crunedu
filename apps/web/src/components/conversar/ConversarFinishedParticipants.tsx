import type { Conversation } from "@/modules/conversar/types";
import { getInitials } from "@/modules/conversar/utils";

export function ConversarFinishedParticipants({ participants }: { participants: Conversation["participants"] }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold text-slate-900">Participantes</h2><div className="mt-3 space-y-2">{participants.map((participant) => <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{getInitials(participant.user.name)}</div><div><p className="font-semibold text-slate-900">{participant.user.name}</p><p className="text-xs text-slate-600">{participant.user.career ?? participant.user.university ?? "La Cantuta"}</p></div></div>{participant.status === "host" ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Anfitrión</span> : null}</div>)}</div></article>;
}
