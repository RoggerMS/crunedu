"use client";

import type { Companion, Conversation } from "@/modules/conversar/types";

type Props = {
  trendingTopics: Array<[string, number]>;
  suggestedCompanions: Companion[];
  activeConversations: Conversation[];
  onGoToConversation: (conversation: Conversation) => void;
};

export function ConversarCompanionsRightRail({ trendingTopics, suggestedCompanions, activeConversations, onGoToConversation }: Props) {
  return (
    <aside className="space-y-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Temas con más gente disponible</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {trendingTopics.map(([topic, amount]) => (<li key={topic} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>{topic}</span><span className="text-xs font-semibold text-slate-500">{amount}</span></li>))}
        </ul>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Sugerencias para ti</h3>
        <div className="mt-3 space-y-2">
          {suggestedCompanions.map((companion) => (<div key={companion.id} className="rounded-2xl bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">{companion.user.name}</p><p className="text-xs text-slate-500">{companion.topics.slice(0, 2).join(" · ")}</p></div>))}
        </div>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Conversaciones activas ahora</h3>
        <div className="mt-3 space-y-3">
          {activeConversations.map((conversation) => (
            <div key={conversation.id} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{conversation.title}</p>
              <p className="mt-1 text-xs text-slate-500">{conversation.category}</p>
              <p className="mt-1 text-xs text-slate-500">{conversation.talkingCount} hablando · {conversation.listeningCount} escuchando</p>
              <button type="button" className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-800" onClick={() => onGoToConversation(conversation)}>Entrar</button>
            </div>
          ))}
        </div>
      </article>
    </aside>
  );
}
