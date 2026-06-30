"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SecondaryButton } from "@/components/ui";
import { ConversarAudioPlayer } from "@/components/conversar/ConversarAudioPlayer";
import { ConversarSkeleton, ConversarError, ConversarEmpty } from "@/components/conversar/ConversarStates";
import { fetchRecordings, playRecording, getMaterialUrl } from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import type { ConversationRecordingItem, ConversationType } from "@crunedu/shared";

type TabKey = "all" | "academic" | "debates" | "study" | "mostPlayed" | "recent";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "academic", label: "Académicas" },
  { key: "debates", label: "Debates" },
  { key: "study", label: "Salas de estudio" },
  { key: "mostPlayed", label: "Más escuchadas" },
  { key: "recent", label: "Recientes" },
];

const ACADEMIC_CATEGORIES = new Set(["Matemática", "Historia", "Física", "Programación", "Inglés", "Filosofía", "Tecnología / Educación"]);

export default function ConversarRecordingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [recordings, setRecordings] = useState<ConversationRecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sort = activeTab === "mostPlayed" ? "popular" : undefined;
      const typeFilter: ConversationType | undefined =
        activeTab === "debates" ? "DEBATE" : activeTab === "study" ? "STUDY" : undefined;
      const res = await fetchRecordings({ search: search || undefined, sort, type: typeFilter });
      let items = res.items;
      if (activeTab === "academic") {
        items = items.filter((r) => ACADEMIC_CATEGORIES.has(r.category));
      }
      if (activeTab === "recent") {
        items = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      setRecordings(items);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar las grabaciones."));
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  const totalPlays = useMemo(() => recordings.reduce((sum, r) => sum + r.plays, 0), [recordings]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Grabaciones</h1>
            <p className="text-sm text-slate-600 sm:text-base">Escucha conversaciones pasadas, debates y salas de estudio grabadas.</p>
          </div>
          <Link href="/app/conversar"><SecondaryButton type="button">Volver a Conversar</SecondaryButton></Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{tab.label}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar grabaciones..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
      </div>

      {loading ? <ConversarSkeleton /> : error ? <ConversarError message={error} onRetry={load} /> : recordings.length === 0 ? (
        <ConversarEmpty title="No hay grabaciones disponibles" description="Las conversaciones grabadas aparecerán aquí cuando estén listas." />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{recordings.length} grabaciones · {totalPlays} reproducciones totales</p>
          {recordings.map((rec) => (
            <div key={rec.id}>
              <div className="mb-1 flex items-center justify-between">
                <Link href={`/app/conversar/${rec.conversationId}/finalizada`} className="text-sm font-semibold text-slate-900 hover:text-indigo-700">{rec.title}</Link>
                <span className="text-xs text-slate-500">{rec.plays} reproducciones</span>
              </div>
              {rec.fileUrl ? (
                <ConversarAudioPlayer
                  src={getMaterialUrl(rec.fileUrl)}
                  title={rec.title}
                  durationSeconds={rec.durationSeconds}
                  onPlayCount={() => playRecording(rec.id).catch(() => undefined)}
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  El archivo de audio no está disponible todavía.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
