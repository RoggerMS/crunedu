import Link from "next/link";
import type { Conversation } from "@/modules/conversar/types";

interface Props {
  conversation: Conversation;
}

export function ConversarDebateHeader({ conversation }: Props) {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <Link href="/app/conversar" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← Volver a Conversar
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Debate: {conversation.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-full bg-slate-100 px-2.5 py-1">{conversation.course ?? conversation.category}</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">Debate formal</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">Estado: {conversation.status}</span>
            {conversation.status === "live" && conversation.isRecording ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">● Grabando</span>
            ) : null}
          </div>
        </div>
        <p className="text-sm font-medium text-slate-700">
          {conversation.talkingCount} hablando · {conversation.listeningCount} escuchando
        </p>
      </div>
      {conversation.sourceConversationId ? (
        <p className="mt-3 text-sm text-slate-600">Este debate surgió a partir de una conversación abierta.</p>
      ) : null}
    </header>
  );
}
