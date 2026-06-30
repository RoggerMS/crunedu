"use client";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
import { ConversarCompactCard } from "@/components/conversar/ConversarCompactCard";
import { ConversarSkeleton, ConversarError, ConversarEmpty } from "@/components/conversar/ConversarStates";
import { useConversations } from "@/hooks/useConversations";
import { adaptConversation } from "@/modules/conversar/adapters";

export default function Page() {
  const { items, loading, error, refresh } = useConversations({ mode: "debates", autoRefreshMs: 30_000 });
  const adapted = items.map(adaptConversation);
  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <ConversarActionBar />
      <h2 className="text-lg font-bold text-slate-900">Debates de audio</h2>
      {loading ? <ConversarSkeleton /> : error ? <ConversarError message={error} onRetry={refresh} /> : adapted.length === 0 ? <ConversarEmpty title="No hay debates programados" description="Crea un debate con posturas iniciales para iniciar una discusión formal." /> : <div className="space-y-3">{adapted.map((c) => <ConversarCompactCard key={c.id} conversation={c} />)}</div>}
    </section>
  );
}
