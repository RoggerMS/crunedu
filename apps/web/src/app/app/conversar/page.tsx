"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ConversarConversationCard } from "@/components/conversar/ConversarConversationCard";
import { ConversarFilters } from "@/components/conversar/ConversarFilters";
import { ConversarRightSidebar } from "@/components/conversar/ConversarRightSidebar";
import { mockConversations } from "@/modules/conversar/mock-data";
import type { Conversation, ConversationStatus, ConversationType } from "@/modules/conversar/types";

type TabKey = "all" | "academic" | "general" | "live" | "debates" | "recordings";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "academic", label: "Académicos" },
  { key: "general", label: "Generales" },
  { key: "live", label: "En vivo ahora" },
  { key: "debates", label: "Debates" },
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
  const searchParams = useSearchParams();
  const initialTab = useMemo<TabKey>(() => {
    const tab = searchParams.get("tab");
    if (tab === "debates") return "debates";
    if (tab === "recordings") return "recordings";
    return "all";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<ConversationType | "all">("all");
  const [status, setStatus] = useState<ConversationStatus | "all">("all");
  const [sort, setSort] = useState<"latest" | "active" | "plays">("latest");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredConversations = useMemo(() => {
    let conversations = [...mockConversations];

    conversations = conversations.filter((conversation) => {
      if (activeTab === "all") return true;
      if (activeTab === "live") return conversation.status === "live";
      if (activeTab === "debates") return conversation.type === "debate";
      if (activeTab === "recordings") {
        const isLiveOrWaiting = conversation.status === "live" || conversation.status === "waiting";

        return (
          conversation.status === "finished" ||
          conversation.status === "recorded" ||
          (!isLiveOrWaiting && conversation.recording?.status === "available")
        );
      }

      const isAcademic =
        academicCategories.has(conversation.category) ||
        (conversation.course ? academicCategories.has(conversation.course) : false);
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
      conversations = conversations.filter(
        (conversation) => conversation.category === category || conversation.course === category,
      );
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
      <header className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-100 via-blue-100 to-violet-100 p-[1px] shadow-soft">
        <div className="rounded-[22px] bg-white/90 p-5 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Conversar</h1>
              <p className="max-w-2xl text-sm text-slate-700 sm:text-base">
                Encuentra estudiantes para hablar, estudiar, resolver dudas o compartir ideas.
              </p>
              <p className="text-xs font-medium text-indigo-700 sm:text-sm">
                Salas de estudio, conversaciones abiertas, debates y grabaciones en un solo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-md lg:justify-end">
              <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>
                Crear conversación
              </PrimaryButton>
              <Link href="/app/conversar/grabaciones">
                <SecondaryButton type="button">Ver grabaciones</SecondaryButton>
              </Link>
              <SecondaryButton type="button" onClick={() => router.push("/app/conversar/companeros")}>
                Buscar compañeros
              </SecondaryButton>
            </div>
          </div>
        </div>
      </header>

      <nav className="rounded-3xl border border-indigo-100 bg-white/95 p-3 shadow-soft" aria-label="Tipos de conversación">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                  : "border-transparent bg-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-4">
          {filteredConversations.length ? (
            filteredConversations.map((conversation) => {
              const isLiveOrWaiting =
                conversation.status === "live" || conversation.status === "waiting";
              const isDebateRoom = conversation.type === "debate" && isLiveOrWaiting;
              const canOpenStandardRoom = isLiveOrWaiting && conversation.type !== "debate";
              const canOpenFinishedByStatus =
                conversation.status === "finished" || conversation.status === "recorded";
              const canOpenFinishedByRecording =
                !isLiveOrWaiting && conversation.recording?.status === "available";
              const canOpenPrimary =
                isDebateRoom ||
                canOpenStandardRoom ||
                canOpenFinishedByStatus ||
                canOpenFinishedByRecording;

              return (
                <ConversarConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isPrimaryDisabled={!canOpenPrimary}
                  onPrimaryAction={(selectedConversation) => {
                    const isLiveOrWaiting =
                      selectedConversation.status === "live" ||
                      selectedConversation.status === "waiting";

                    if (isLiveOrWaiting && selectedConversation.type === "debate") {
                      router.push(`/app/conversar/${selectedConversation.id}/debate`);
                      return;
                    }

                    if (isLiveOrWaiting && selectedConversation.type !== "debate") {
                      router.push(`/app/conversar/${selectedConversation.id}`);
                      return;
                    }

                    if (
                      selectedConversation.status === "finished" ||
                      selectedConversation.status === "recorded"
                    ) {
                      router.push(`/app/conversar/${selectedConversation.id}/finalizada`);
                      return;
                    }

                    if (!isLiveOrWaiting && selectedConversation.recording?.status === "available") {
                      router.push(`/app/conversar/${selectedConversation.id}/finalizada`);
                    }
                  }}
                />
              );
            })
          ) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-lg font-bold text-slate-900">No encontramos conversaciones</h3>
              <p className="mt-2 text-sm text-slate-600">
                Prueba con otro tema, cambia los filtros o crea una nueva conversación cuando el módulo
                esté disponible.
              </p>
              <PrimaryButton
                type="button"
                onClick={() => router.push("/app/conversar/nueva")}
                className="mt-4"
              >
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
