"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { Conversation, ConversationType } from "@/modules/conversar/types";

type RecordingsTabKey = "all" | "academic" | "debates" | "study" | "mostPlayed" | "recent";
type SortOption = "latest" | "plays" | "duration";
type DateOption = "all" | "7d" | "30d";

const tabs: { key: RecordingsTabKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "academic", label: "Académicas" },
  { key: "debates", label: "Debates" },
  { key: "study", label: "Salas de estudio" },
  { key: "mostPlayed", label: "Más escuchadas" },
  { key: "recent", label: "Recientes" },
];

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
    let recordings = mockConversations.filter((conversation) => {
      const isLiveOrWaiting = conversation.status === "live" || conversation.status === "waiting";
      if (conversation.status === "finished" || conversation.status === "recorded") return true;
      return !isLiveOrWaiting && conversation.recording?.status === "available";
    });

    recordings = applyTabFilter(recordings, activeTab);

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch) {
      recordings = recordings.filter((conversation) => {
        const searchable = [conversation.title, conversation.description, conversation.category, conversation.course ?? "", conversation.createdBy.name, ...conversation.tags]
          .join(" ")
          .toLocaleLowerCase();
        return searchable.includes(normalizedSearch);
      });
    }

    if (topic !== "all") recordings = recordings.filter((conversation) => conversation.category === topic || conversation.course === topic);
    if (type !== "all") recordings = recordings.filter((conversation) => conversation.type === type);
    if (duration !== "all") recordings = recordings.filter((conversation) => (conversation.recording?.durationLabel ?? "").includes(duration));

    if (date !== "all") {
      const now = new Date();
      const threshold = new Date(now);
      threshold.setDate(now.getDate() - (date === "7d" ? 7 : 30));
      recordings = recordings.filter((conversation) => new Date(conversation.createdAt) >= threshold);
    }

    const finalSort = activeTab === "mostPlayed" ? "plays" : activeTab === "recent" ? "latest" : sort;
    return recordings.sort((a, b) => sortRecordings(a, b, finalSort));
  }, [activeTab, date, duration, searchTerm, sort, topic, type]);

  const mostPlayed = useMemo(() => [...visibleRecordings].sort((a, b) => (b.recording?.plays ?? 0) - (a.recording?.plays ?? 0)).slice(0, 3), [visibleRecordings]);

  const featuredCreators = useMemo(() => {
    const unique = new Map<string, Conversation["createdBy"]>();
    visibleRecordings.forEach((conversation) => {
      if (!unique.has(conversation.createdBy.id)) unique.set(conversation.createdBy.id, conversation.createdBy);
    });
    return Array.from(unique.values()).slice(0, 4);
  }, [visibleRecordings]);

  const topicOptions = useMemo(() => {
    const unique = new Set<string>();
    mockConversations.forEach((conversation) => {
      unique.add(conversation.category);
      if (conversation.course) unique.add(conversation.course);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, []);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Grabaciones</h1>
            <p className="text-sm text-slate-600 sm:text-base">Escucha conversaciones pasadas, debates y salas de estudio grabadas.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/conversar"><SecondaryButton type="button">Volver a Conversar</SecondaryButton></Link>
            <PrimaryButton type="button" disabled>Explorar temas</PrimaryButton>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6">
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar grabación" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2" />
        <SelectFilter label="Curso/Tema" value={topic} onChange={setTopic} options={[{ value: "all", label: "Todos" }, ...topicOptions.map((item) => ({ value: item, label: item }))]} />
        <SelectFilter label="Tipo" value={type} onChange={(value) => setType(value as ConversationType | "all")} options={[{ value: "all", label: "Todos" }, { value: "open", label: "Conversación abierta" }, { value: "study", label: "Sala de estudio" }, { value: "question", label: "Pregunta para conversar" }, { value: "debate", label: "Debate formal" }]} />
        <SelectFilter label="Duración" value={duration} onChange={setDuration} options={[{ value: "all", label: "Todas" }, { value: "20", label: "20+ min" }, { value: "30", label: "30+ min" }, { value: "40", label: "40+ min" }]} />
        <SelectFilter label="Fecha" value={date} onChange={(value) => setDate(value as DateOption)} options={[{ value: "all", label: "Todas" }, { value: "7d", label: "Últimos 7 días" }, { value: "30d", label: "Últimos 30 días" }]} />
        <SelectFilter label="Ordenar" value={sort} onChange={(value) => setSort(value as SortOption)} options={[{ value: "latest", label: "Más recientes" }, { value: "plays", label: "Más escuchadas" }, { value: "duration", label: "Mayor duración" }]} />
      </article>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {visibleRecordings.length ? visibleRecordings.map((conversation) => (
            <article key={conversation.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{getTypeLabel(conversation.type)}</span>
                <span>{conversation.course ?? conversation.category}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{conversation.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>Duración: <span className="font-semibold text-slate-800">{conversation.recording?.durationLabel ?? "No disponible"}</span></p>
                <p>Reproducciones: <span className="font-semibold text-slate-800">{conversation.recording?.plays ?? 0}</span></p>
                <p>Creador: <span className="font-semibold text-slate-800">{conversation.createdBy.name}</span></p>
                <p>Estado: <span className="font-semibold text-slate-800">{getRecordingStatusLabel(conversation.recording?.status)}</span></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/app/conversar/${conversation.id}/finalizada`}><PrimaryButton type="button">Escuchar</PrimaryButton></Link>
                <SecondaryButton type="button" disabled>Guardar</SecondaryButton>
                <Link href={`/app/conversar/${conversation.id}/finalizada`}><SecondaryButton type="button">Ver detalles</SecondaryButton></Link>
              </div>
            </article>
          )) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-lg font-bold text-slate-900">No encontramos grabaciones</h3>
              <p className="mt-2 text-sm text-slate-600">Prueba con otro tema o cambia los filtros para encontrar conversaciones grabadas.</p>
              <Link href="/app/conversar" className="mt-4 inline-flex"><PrimaryButton type="button">Volver a Conversar</PrimaryButton></Link>
            </article>
          )}
        </main>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-bold text-slate-900">Más reproducidas esta semana</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {mostPlayed.map((conversation) => <li key={conversation.id} className="rounded-2xl bg-slate-50 px-3 py-2">{conversation.title} · {conversation.recording?.plays ?? 0} reproducciones</li>)}
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-bold text-slate-900">Temas populares</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {["Lógica", "Historia del Perú", "Métodos de estudio", "IA y educación", "Argumentación"].map((topicItem) => <li key={topicItem} className="rounded-2xl bg-slate-50 px-3 py-2">{topicItem}</li>)}
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-bold text-slate-900">Creadores destacados</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {featuredCreators.map((creator) => (
                <li key={creator.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-900">{creator.name}</p>
                  <p className="text-xs text-slate-500">{creator.career ?? creator.university ?? "La Cantuta"}</p>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}

function applyTabFilter(conversations: Conversation[], tab: RecordingsTabKey) {
  if (tab === "all" || tab === "mostPlayed" || tab === "recent") return conversations;
  if (tab === "debates") return conversations.filter((conversation) => conversation.type === "debate");
  if (tab === "study") return conversations.filter((conversation) => conversation.type === "study");
  if (tab === "academic") return conversations.filter((conversation) => academicCategories.has(conversation.category) || (conversation.course ? academicCategories.has(conversation.course) : false));
  return conversations;
}

function sortRecordings(a: Conversation, b: Conversation, sort: SortOption) {
  if (sort === "plays") return (b.recording?.plays ?? 0) - (a.recording?.plays ?? 0);
  if (sort === "duration") return parseDurationMinutes(b.recording?.durationLabel) - parseDurationMinutes(a.recording?.durationLabel);
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function parseDurationMinutes(durationLabel?: string | null) {
  if (!durationLabel) return 0;
  const value = Number.parseInt(durationLabel, 10);
  return Number.isNaN(value) ? 0 : value;
}

function getTypeLabel(type: ConversationType) {
  if (type === "study") return "Sala de estudio";
  if (type === "debate") return "Debate formal";
  if (type === "question") return "Pregunta para conversar";
  return "Conversación abierta";
}

function getRecordingStatusLabel(status?: Conversation["recording"]["status"]) {
  if (status === "processing") return "Procesándose";
  if (status === "restricted") return "Restringida";
  return "Grabación disponible";
}

type SelectOption = { value: string; label: string };

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SelectOption[] }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-indigo-500 focus:ring-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
