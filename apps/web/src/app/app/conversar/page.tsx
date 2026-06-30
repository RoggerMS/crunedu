"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
import { ConversarCompactCard } from "@/components/conversar/ConversarCompactCard";
import { ConversarSkeleton, ConversarError, ConversarEmpty } from "@/components/conversar/ConversarStates";
import { useConversations } from "@/hooks/useConversations";
import { adaptConversation } from "@/modules/conversar/adapters";
import type { ConversationType } from "@crunedu/shared";

const TYPE_FILTERS: Array<{ label: string; value?: ConversationType }> = [
  { label: "Todas" },
  { label: "Abiertas", value: "OPEN" },
  { label: "Estudio", value: "STUDY" },
  { label: "Preguntas", value: "QUESTION" },
  { label: "Debates", value: "DEBATE" },
];

export default function ConversarPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ConversationType | undefined>(undefined);

  const { items, loading, error, refresh } = useConversations({
    mode: "all",
    filters: { search: search || undefined, type: typeFilter },
    autoRefreshMs: 30_000,
  });

  const adapted = useMemo(() => items.map(adaptConversation), [items]);
  const live = adapted.filter((c) => c.status === "live");
  const waiting = adapted.filter((c) => c.status === "waiting");

  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Conversar</h1>
        <p className="text-sm text-slate-500">
          Salas de audio en vivo para conversar, estudiar, preguntar y debatir con compañeros de tu universidad.
        </p>
      </div>

      <ConversarActionBar />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setTypeFilter(f.value)}
              className={`h-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${
                typeFilter === f.value
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ConversarSkeleton />
      ) : error ? (
        <ConversarError message={error} onRetry={refresh} />
      ) : adapted.length === 0 ? (
        <ConversarEmpty
          title="No hay conversaciones aún"
          description="Crea la primera conversación de audio o busca compañeros para estudiar juntos."
        />
      ) : (
        <>
          {live.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  En vivo ahora
                </h2>
                <Link href="/app/conversar/en-vivo" className="text-sm font-semibold text-indigo-700">
                  Ver todas
                </Link>
              </div>
              {live.map((conversation) => (
                <ConversarCompactCard key={conversation.id} conversation={conversation} />
              ))}
            </div>
          ) : null}

          {waiting.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">En espera</h2>
                <Link href="/app/conversar/en-espera" className="text-sm font-semibold text-indigo-700">
                  Ver todas
                </Link>
              </div>
              {waiting.map((conversation) => (
                <ConversarCompactCard key={conversation.id} conversation={conversation} forceWaitingAction />
              ))}
            </div>
          ) : null}

          {adapted.length > 0 && live.length === 0 && waiting.length === 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Conversaciones</h2>
              {adapted.map((conversation) => (
                <ConversarCompactCard key={conversation.id} conversation={conversation} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
