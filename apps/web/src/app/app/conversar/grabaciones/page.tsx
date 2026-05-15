"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ConversarRecordingCard } from "@/components/conversar/ConversarRecordingCard";
import { ConversarRecordingsEmptyState } from "@/components/conversar/ConversarRecordingsEmptyState";
import { ConversarRecordingsFilters } from "@/components/conversar/ConversarRecordingsFilters";
import { ConversarRecordingsRightRail } from "@/components/conversar/ConversarRecordingsRightRail";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { Conversation, ConversationType } from "@/modules/conversar/types";
import { isVisibleRecording } from "@/modules/conversar/utils";

type RecordingsTabKey = "all" | "academic" | "debates" | "study" | "mostPlayed" | "recent";
type SortOption = "latest" | "plays" | "duration";
type DateOption = "all" | "7d" | "30d";

const tabs = [{ key: "all", label: "Todas" }, { key: "academic", label: "Académicas" }, { key: "debates", label: "Debates" }, { key: "study", label: "Salas de estudio" }, { key: "mostPlayed", label: "Más escuchadas" }, { key: "recent", label: "Recientes" }] as const;
const academicCategories = new Set(["Matemática", "Historia", "Física", "Programación", "Inglés", "Filosofía", "Tecnología / Educación", "Educación"]);

export default function ConversarRecordingsPage() {
  const [activeTab, setActiveTab] = useState<RecordingsTabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [topic, setTopic] = useState("all");
  const [type, setType] = useState<ConversationType | "all">("all");
  const [duration, setDuration] = useState("all");
  const [date, setDate] = useState<DateOption>("all");
  const [sort, setSort] = useState<SortOption>("latest");

  const visibleRecordings = useMemo(() => {
    let recordings = mockConversations.filter(isVisibleRecording);
    recordings = applyTabFilter(recordings, activeTab);
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch) recordings = recordings.filter((c) => [c.title, c.description, c.category, c.course ?? "", c.createdBy.name, ...c.tags].join(" ").toLocaleLowerCase().includes(normalizedSearch));
    if (topic !== "all") recordings = recordings.filter((c) => c.category === topic || c.course === topic);
    if (type !== "all") recordings = recordings.filter((c) => c.type === type);
    if (duration !== "all") recordings = recordings.filter((c) => (c.recording?.durationLabel ?? "").includes(duration));
    if (date !== "all") {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - (date === "7d" ? 7 : 30));
      recordings = recordings.filter((c) => new Date(c.createdAt) >= threshold);
    }
    const finalSort = activeTab === "mostPlayed" ? "plays" : activeTab === "recent" ? "latest" : sort;
    return recordings.sort((a, b) => sortRecordings(a, b, finalSort));
  }, [activeTab, date, duration, searchTerm, sort, topic, type]);

  const mostPlayed = useMemo(() => [...visibleRecordings].sort((a, b) => (b.recording?.plays ?? 0) - (a.recording?.plays ?? 0)).slice(0, 3), [visibleRecordings]);
  const featuredCreators = useMemo(() => Array.from(new Map(visibleRecordings.map((c) => [c.createdBy.id, c.createdBy])).values()).slice(0, 4), [visibleRecordings]);
  const topicOptions = useMemo(() => Array.from(new Set(mockConversations.flatMap((c) => [c.category, c.course].filter(Boolean) as string[]))).sort((a, b) => a.localeCompare(b)).map((item) => ({ value: item, label: item })), []);

  return <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h1 className="text-3xl font-black tracking-tight text-slate-900">Grabaciones</h1><p className="text-sm text-slate-600 sm:text-base">Escucha conversaciones pasadas, debates y salas de estudio grabadas.</p></div><div className="flex flex-wrap gap-3"><Link href="/app/conversar"><SecondaryButton type="button">Volver a Conversar</SecondaryButton></Link><PrimaryButton type="button" disabled>Explorar temas</PrimaryButton></div></div></header><div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{tab.label}</button>)}</div><ConversarRecordingsFilters searchTerm={searchTerm} onSearchTermChange={setSearchTerm} topic={topic} onTopicChange={setTopic} type={type} onTypeChange={(value) => setType(value as ConversationType | "all")} duration={duration} onDurationChange={setDuration} date={date} onDateChange={(value) => setDate(value as DateOption)} sort={sort} onSortChange={(value) => setSort(value as SortOption)} topicOptions={topicOptions} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><main className="space-y-4">{visibleRecordings.length ? visibleRecordings.map((conversation) => <ConversarRecordingCard key={conversation.id} conversation={conversation} />) : <ConversarRecordingsEmptyState />}</main><ConversarRecordingsRightRail mostPlayed={mostPlayed} featuredCreators={featuredCreators} /></div></section>;
}

function applyTabFilter(conversations: Conversation[], tab: RecordingsTabKey) { if (tab === "all" || tab === "mostPlayed" || tab === "recent") return conversations; if (tab === "debates") return conversations.filter((conversation) => conversation.type === "debate"); if (tab === "study") return conversations.filter((conversation) => conversation.type === "study"); if (tab === "academic") return conversations.filter((conversation) => academicCategories.has(conversation.category) || (conversation.course ? academicCategories.has(conversation.course) : false)); return conversations; }
function sortRecordings(a: Conversation, b: Conversation, sort: SortOption) { if (sort === "plays") return (b.recording?.plays ?? 0) - (a.recording?.plays ?? 0); if (sort === "duration") return parseDurationMinutes(b.recording?.durationLabel) - parseDurationMinutes(a.recording?.durationLabel); return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); }
function parseDurationMinutes(durationLabel?: string | null) { if (!durationLabel) return 0; const value = Number.parseInt(durationLabel, 10); return Number.isNaN(value) ? 0 : value; }
