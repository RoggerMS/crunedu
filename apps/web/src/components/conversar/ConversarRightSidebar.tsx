import Link from "next/link";
import type { Companion, Conversation } from "@/modules/conversar/types";
import { formatParticipantSummary } from "@/modules/conversar/utils";

type ConversarRightSidebarProps = {
  conversations: Conversation[];
  companions?: Companion[];
};

export function ConversarRightSidebar({ conversations, companions = [] }: ConversarRightSidebarProps) {
  const liveConversations = conversations.filter((conversation) => conversation.status === "live").slice(0, 3);
  const debateConversations = conversations.filter((conversation) => conversation.type === "debate").slice(0, 3);
  const popularTopics = Array.from(
    new Set(conversations.flatMap((conversation) => [conversation.course, conversation.category, ...conversation.tags]).filter(Boolean)),
  ).slice(0, 5);

  return (
    <aside className="space-y-4">
      <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Salas activas ahora</h3>
        {liveConversations.length ? (
          <ul className="mt-3 space-y-3">
            {liveConversations.map((conversation) => (
              <li key={conversation.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                <p className="text-sm font-semibold text-slate-800">{conversation.title}</p>
                <p className="mt-1 text-xs text-slate-600">{formatParticipantSummary(conversation)}</p>
                <Link
                  href={`/app/conversar/${conversation.id}`}
                  className="mt-2 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-200"
                >
                  Entrar ahora
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            Todavía no hay salas en vivo. Puedes iniciar una desde las salas en espera.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Temas populares</h3>
        {popularTopics.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {popularTopics.map((topic) => (
              <li key={topic} className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                <p className="font-medium text-slate-700">{topic}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            Los temas aparecerán cuando existan conversaciones publicadas.
          </p>
        )}
      </section>

      {companions.length ? (
        <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-soft">
          <h3 className="text-sm font-bold text-slate-900">Estudiantes disponibles</h3>
          <ul className="mt-3 space-y-3">
            {companions.slice(0, 4).map((companion) => (
              <li key={companion.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-sm font-semibold text-slate-800">{companion.user.name}</p>
                <p className="mt-1 text-xs text-slate-600">{companion.topics[0] ?? "Conversación universitaria"}</p>
                <p className="mt-1 text-xs text-slate-500">{companion.availability}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Conversaciones que se volvieron debate</h3>
        {debateConversations.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {debateConversations.map((conversation) => (
              <li key={conversation.id} className="rounded-2xl border border-violet-200 bg-violet-50/70 px-3 py-2">
                <Link href={`/app/conversar/${conversation.id}/debate`} className="font-medium text-violet-800 hover:text-violet-950">
                  {conversation.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            Los debates aparecerán aquí cuando se publiquen.
          </p>
        )}
      </section>
    </aside>
  );
}
