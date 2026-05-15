"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { mockCompanions, mockConversations } from "@/modules/conversar/mock-data";
import { getConversationRoute } from "@/modules/conversar/utils";
import { ConversarCompanionCard } from "@/components/conversar/ConversarCompanionCard";
import { ConversarCompanionFilters } from "@/components/conversar/ConversarCompanionFilters";
import { ConversarCompanionsRightRail } from "@/components/conversar/ConversarCompanionsRightRail";
import { ConversarCompanionsEmptyState } from "@/components/conversar/ConversarCompanionsEmptyState";

export default function ConversarCompanerosPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [helpTypeFilter, setHelpTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [preparedInvites, setPreparedInvites] = useState<string[]>([]);

  const filteredCompanions = useMemo(() => mockCompanions.filter((c) => (query ? [c.user.name,c.user.career ?? "",c.user.university ?? "",c.description,...c.topics].join(" ").toLowerCase().includes(query.trim().toLowerCase()) : true) && (voiceFilter !== "voice" || c.canVoice) && (voiceFilter !== "text" || !c.canVoice) && (universityFilter === "all" || (universityFilter === "cantuta" ? c.user.university?.toLowerCase().includes("cantuta") : !c.user.university?.toLowerCase().includes("cantuta"))) && (helpTypeFilter === "all" || c.topics.some((t) => t.toLowerCase() === helpTypeFilter.toLowerCase()))), [query, voiceFilter, universityFilter, helpTypeFilter]);
  const trendingTopics = useMemo(() => { const counter = new Map<string, number>(); for (const c of mockCompanions) for (const t of c.topics) counter.set(t, (counter.get(t) ?? 0)+1); return [...counter.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5); }, []);
  const suggestedCompanions = useMemo(() => mockCompanions.filter((c) => c.canVoice).slice(0, 3), []);
  const activeConversations = useMemo(() => mockConversations.filter((conversation) => conversation.status === "live"), []);

  return <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h1 className="text-3xl font-black tracking-tight text-slate-900">Buscar compañeros</h1><p className="text-sm text-slate-600 sm:text-base">Encuentra estudiantes disponibles para conversar o estudiar.</p></div><div className="flex flex-wrap gap-3"><PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>Crear conversación</PrimaryButton><Link href="/app/conversar"><SecondaryButton type="button">Volver a Conversar</SecondaryButton></Link></div></div></header><ConversarCompanionFilters query={query} onQueryChange={setQuery} voiceFilter={voiceFilter} onVoiceFilterChange={setVoiceFilter} universityFilter={universityFilter} onUniversityFilterChange={setUniversityFilter} helpTypeFilter={helpTypeFilter} onHelpTypeFilterChange={setHelpTypeFilter} levelFilter={levelFilter} onLevelFilterChange={setLevelFilter} helpTypeOptions={["all","Matemática","Historia","Física","Inglés","Programación","Filosofía"].map((o)=>({value:o,label:o==="all"?"Todas":o}))} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><main className="space-y-4"><p className="px-1 text-xs text-slate-500 sm:text-sm">Mostrando {filteredCompanions.length} compañeros disponibles</p>{filteredCompanions.length ? filteredCompanions.map((companion) => <ConversarCompanionCard key={companion.id} companion={companion} invitePrepared={preparedInvites.includes(companion.id)} onInvite={() => !preparedInvites.includes(companion.id) && setPreparedInvites((prev) => [...prev, companion.id])} />) : <ConversarCompanionsEmptyState onCreate={() => router.push("/app/conversar/nueva")} onBack={() => router.push("/app/conversar")} />}</main><ConversarCompanionsRightRail trendingTopics={trendingTopics} suggestedCompanions={suggestedCompanions} activeConversations={activeConversations} onGoToConversation={(c)=>router.push(getConversationRoute(c))} /></div></section>;
}
