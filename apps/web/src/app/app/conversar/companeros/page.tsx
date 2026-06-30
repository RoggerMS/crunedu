"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ConversarCompanionCard } from "@/components/conversar/ConversarCompanionCard";
import { ConversarCompanionFilters } from "@/components/conversar/ConversarCompanionFilters";
import { ConversarCompanionsEmptyState } from "@/components/conversar/ConversarCompanionsEmptyState";
import { ConversarSkeleton, ConversarError } from "@/components/conversar/ConversarStates";
import { fetchCompanions } from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import { adaptCompanion } from "@/modules/conversar/adapters";
import type { ConversationCompanion } from "@crunedu/shared";

export default function ConversarCompanerosPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [helpTypeFilter, setHelpTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [companions, setCompanions] = useState<ConversationCompanion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preparedInvites, setPreparedInvites] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompanions({ search: query || undefined, availableForVoice: voiceFilter === "voice" ? true : undefined });
      setCompanions(res.items);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar los compañeros."));
    } finally {
      setLoading(false);
    }
  }, [query, voiceFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  const adapted = useMemo(() => companions.map(adaptCompanion), [companions]);

  const trendingTopics = useMemo(() => {
    const counter = new Map<string, number>();
    for (const c of companions) for (const t of c.topics) counter.set(t, (counter.get(t) ?? 0) + 1);
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
  }, [companions]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Buscar compañeros</h1>
            <p className="text-sm text-slate-600 sm:text-base">Encuentra estudiantes disponibles para conversar o estudiar.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>Crear conversación</PrimaryButton>
            <Link href="/app/conversar"><SecondaryButton type="button">Volver a Conversar</SecondaryButton></Link>
          </div>
        </div>
      </header>

      <ConversarCompanionFilters
        query={query}
        onQueryChange={setQuery}
        voiceFilter={voiceFilter}
        onVoiceFilterChange={setVoiceFilter}
        universityFilter={universityFilter}
        onUniversityFilterChange={setUniversityFilter}
        helpTypeFilter={helpTypeFilter}
        onHelpTypeFilterChange={setHelpTypeFilter}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        helpTypeOptions={["all", "Matemática", "Historia", "Física", "Inglés", "Programación", "Filosofía"].map((o) => ({ value: o, label: o === "all" ? "Todas" : o }))}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-4">
          <p className="px-1 text-xs text-slate-500 sm:text-sm">Mostrando {adapted.length} compañeros disponibles</p>
          {loading ? <ConversarSkeleton /> : error ? <ConversarError message={error} onRetry={load} /> : adapted.length ? adapted.map((companion) => (
            <ConversarCompanionCard
              key={companion.id}
              companion={companion}
              invitePrepared={preparedInvites.includes(companion.id)}
              onInvite={() => !preparedInvites.includes(companion.id) && setPreparedInvites((prev) => [...prev, companion.id])}
            />
          )) : <ConversarCompanionsEmptyState onCreate={() => router.push("/app/conversar/nueva")} onBack={() => router.push("/app/conversar")} />}
        </main>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">Temas populares</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {trendingTopics.length ? trendingTopics.map((t) => (
                <span key={t.tag} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{t.tag} · {t.count}</span>
              )) : <p className="text-sm text-slate-500">Sin datos aún.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h3 className="text-sm font-bold text-slate-900">¿Quieres aparecer aquí?</h3>
            <p className="mt-1 text-sm text-slate-600">Activa tu perfil de compañero para que otros te encuentren.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
