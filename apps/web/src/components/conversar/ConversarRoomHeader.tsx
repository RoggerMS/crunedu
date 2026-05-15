import Link from "next/link";
import type { Conversation } from "@/modules/conversar/types";
import {
  formatParticipantSummary,
  getConversationStatusLabel,
  getConversationTypeLabel,
} from "@/modules/conversar/utils";

export function ConversarRoomHeader({
  conversation,
}: {
  conversation: Conversation;
}) {
  return (
    <header className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <Link
        href="/app/conversar"
        className="text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        ← Volver a Conversar
      </Link>
      <h1 className="text-2xl font-black text-slate-900">
        {conversation.title}
      </h1>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {conversation.course ?? conversation.category}
        </span>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
          {getConversationTypeLabel(conversation.type)}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
          {getConversationStatusLabel(conversation.status)}
        </span>
        {conversation.status === "live" && conversation.isRecording ? (
          <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
            ● Grabando
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-slate-600">
        {formatParticipantSummary(conversation)}
      </p>
    </header>
  );
}
