"use client";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
import { ConversarCompactCard } from "@/components/conversar/ConversarCompactCard";
import { ConversarSkeleton, ConversarError, ConversarEmpty } from "@/components/conversar/ConversarStates";
import { useConversations } from "@/hooks/useConversations";
import { adaptConversation } from "@/modules/conversar/adapters";

export default function Page() {
  const { items, loading, error, refresh } = useConversations({ mode: "live", autoRefreshMs: 15_000 });
  const adapted = items.map(adaptConversation);
  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <ConversarActionBar />
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> En vivo
      </h2>
      {loading ? <ConversarSkeleton /> : error ? <ConversarError message={error} onRetry={refresh} /> : adapted.length === 0 ? <ConversarEmpty title="No hay conversaciones en vivo" description="Vuelve más tarde o crea una nueva conversación." /> : <div className="space-y-3">{adapted.map((c) => <ConversarCompactCard key={c.id} conversation={c} />)}</div>}
    </section>
  );
}
