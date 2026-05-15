"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ConversarConversationCard } from "@/components/conversar/ConversarConversationCard";
import { ConversarFilters } from "@/components/conversar/ConversarFilters";
import { ConversarRightSidebar } from "@/components/conversar/ConversarRightSidebar";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { Conversation, ConversationStatus, ConversationType } from "@/modules/conversar/types";

type TabKey = "all" | "academic" | "general" | "live" | "recordings";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "academic", label: "Académicos" },
  { key: "general", label: "Generales" },
  { key: "live", label: "En vivo ahora" },
  { key: "recordings", label: "Grabaciones" },
];

const academicCategories = new Set([
  "Matemática",
  "Historia",
  "Física",
  "Programación",
  "Inglés",
  "Filosofía",
  "Tecnología / Educación",
  "Educación",
]);

export default function ConversarPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<ConversationType | "all">("all");
  const [status, setStatus] = useState<ConversationStatus | "all">("all");
  const [sort, setSort] = useState<"latest" | "active" | "plays">("latest");

  const filteredConversations = useMemo(() => {
    let conversations = [...mockConversations];

    conversations = conversations.filter((conversation) => {
      if (activeTab === "all") return true;
      if (activeTab === "live") return conversation.status === "live";
      if (activeTab === "recordings") {
        return (
          conversation.status === "finished" ||
          conversation.status === "recorded" ||
          conversation.recording?.status === "available"
        );
      }

      const isAcademic = academicCategories.has(conversation.category) || (conversation.course ? academicCategories.has(conversation.course) : false);
      if (activeTab === "academic") return isAcademic;
      if (activeTab === "general") return !isAcademic;
      return true;
    });

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch) {
      conversations = conversations.filter((conversation) => {
        const searchableFields = [
          conversation.title,
          conversation.description,
          conversation.category,
          conversation.course ?? "",
          conversation.createdBy.name,
          ...conversation.tags,
        ]
          .join(" ")
          .toLocaleLowerCase();

        return searchableFields.includes(normalizedSearch);
      });
    }

    if (category !== "all") {
      conversations = conversations.filter((conversation) => conversation.category === category || conversation.course === category);
    }

    if (type !== "all") {
      conversations = conversations.filter((conversation) => conversation.type === type);
    }

    if (status !== "all") {
      conversations = conversations.filter((conversation) => conversation.status === status);
    }

    return conversations.sort((a, b) => sortConversations(a, b, sort));
  }, [activeTab, searchTerm, category, type, status, sort]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Conversar</h1>
            <p className="text-sm text-slate-600 sm:text-base">
              Encuentra estudiantes para hablar, estudiar, resolver dudas o compartir ideas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>
              Crear conversación
            </PrimaryButton>
            <SecondaryButton type="button" disabled>
              Buscar compañeros
            </SecondaryButton>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ConversarFilters
        searchTerm={searchTerm}
        category={category}
        type={type}
        status={status}
        sort={sort}
        onSearchTermChange={setSearchTerm}
        onCategoryChange={setCategory}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onSortChange={setSort}
      />

      <div className="px-1 text-xs text-slate-500 sm:text-sm">
        {searchTerm.trim()
          ? `Mostrando ${filteredConversations.length} resultados para '${searchTerm.trim()}'`
          : `Mostrando ${filteredConversations.length} conversaciones`}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {filteredConversations.length ? (
            filteredConversations.map((conversation) => {
              const canOpenFinishedView =
                conversation.status === "finished" ||
                conversation.status === "recorded" ||
                conversation.recording?.status === "available";
              const isDebateRoom =
                conversation.type === "debate" &&
                (conversation.status === "live" || conversation.status === "waiting");
              const canOpenStandardRoom =
                (conversation.status === "live" || conversation.status === "waiting") && conversation.type !== "debate";
              const canOpenPrimary = canOpenFinishedView || isDebateRoom || canOpenStandardRoom;

              return (
                <ConversarConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isPrimaryDisabled={!canOpenPrimary}
                  onPrimaryAction={(selectedConversation) => {
                    const shouldOpenFinished =
                      selectedConversation.status === "finished" ||
                      selectedConversation.status === "recorded" ||
                      selectedConversation.recording?.status === "available";

                    if (shouldOpenFinished) {
                      router.push(`/app/conversar/${selectedConversation.id}/finalizada`);
                      return;
                    }

                    if (
                      selectedConversation.type === "debate" &&
                      (selectedConversation.status === "live" || selectedConversation.status === "waiting")
                    ) {
                      router.push(`/app/conversar/${selectedConversation.id}/debate`);
                      return;
                    }

                    if (selectedConversation.status === "live" || selectedConversation.status === "waiting") {
                      router.push(`/app/conversar/${selectedConversation.id}`);
                    }
                  }}
                />
              );
            })
          ) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-lg font-bold text-slate-900">No encontramos conversaciones</h3>
              <p className="mt-2 text-sm text-slate-600">
                Prueba con otro tema, cambia los filtros o crea una nueva conversación cuando el módulo esté disponible.
              </p>
              <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")} className="mt-4">
                Crear conversación
              </PrimaryButton>
            </article>
          )}
        </main>
        <ConversarRightSidebar />
      </div>
    </section>
  );
}

function sortConversations(a: Conversation, b: Conversation, sort: "latest" | "active" | "plays") {
  if (sort === "active") {
    return b.talkingCount + b.listeningCount - (a.talkingCount + a.listeningCount);
  }

  if (sort === "plays") {
    return (b.recording?.plays ?? 0) - (a.recording?.plays ?? 0);
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
