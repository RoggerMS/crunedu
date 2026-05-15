"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { mockCompanions, mockConversations } from "@/modules/conversar/mock-data";

type VoiceFilter = "all" | "voice" | "text";
type UniversityFilter = "all" | "cantuta" | "other";
type HelpTypeFilter = "all" | "Matemática" | "Historia" | "Física" | "Inglés" | "Programación" | "Filosofía";
type LevelFilter = "all" | "Básico" | "Intermedio" | "Avanzado";

const helpTypeOptions: HelpTypeFilter[] = ["all", "Matemática", "Historia", "Física", "Inglés", "Programación", "Filosofía"];

export default function ConversarCompanerosPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>("all");
  const [universityFilter, setUniversityFilter] = useState<UniversityFilter>("all");
  const [helpTypeFilter, setHelpTypeFilter] = useState<HelpTypeFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [preparedInvites, setPreparedInvites] = useState<string[]>([]);

  const filteredCompanions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return mockCompanions.filter((companion) => {
      if (normalizedQuery) {
        const searchableText = [
          companion.user.name,
          companion.user.career ?? "",
          companion.user.university ?? "",
          companion.description,
          ...companion.topics,
        ]
          .join(" ")
          .toLocaleLowerCase();

        if (!searchableText.includes(normalizedQuery)) return false;
      }

      if (voiceFilter === "voice" && !companion.canVoice) return false;
      if (voiceFilter === "text" && companion.canVoice) return false;

      const isCantuta = companion.user.university?.toLocaleLowerCase().includes("cantuta") ?? false;
      if (universityFilter === "cantuta" && !isCantuta) return false;
      if (universityFilter === "other" && isCantuta) return false;

      if (helpTypeFilter !== "all") {
        const hasHelpType = companion.topics.some((topic) => topic.toLocaleLowerCase() === helpTypeFilter.toLocaleLowerCase());
        if (!hasHelpType) return false;
      }

      return true;
    });
  }, [query, voiceFilter, universityFilter, helpTypeFilter]);

  const trendingTopics = useMemo(() => {
    const counter = new Map<string, number>();

    for (const companion of mockCompanions) {
      for (const topic of companion.topics) {
        counter.set(topic, (counter.get(topic) ?? 0) + 1);
      }
    }

    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  const suggestedCompanions = useMemo(() => mockCompanions.filter((companion) => companion.canVoice).slice(0, 3), []);

  const activeConversations = useMemo(() => mockConversations.filter((conversation) => conversation.status === "live"), []);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Buscar compañeros</h1>
            <p className="text-sm text-slate-600 sm:text-base">Encuentra estudiantes disponibles para conversar o estudiar.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>Crear conversación</PrimaryButton>
            <Link href="/app/conversar">
              <SecondaryButton type="button">Volver a Conversar</SecondaryButton>
            </Link>
          </div>
        </div>
      </header>

      <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tema o curso</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por tema, curso o estudiante..."
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-200 focus:ring"
          />
        </label>

        <SelectField label="Disponible ahora" value={voiceFilter} onChange={(value) => setVoiceFilter(value as VoiceFilter)} options={[{ value: "all", label: "Todos" }, { value: "voice", label: "Disponible con voz" }, { value: "text", label: "Solo texto / no voz" }]} />

        <SelectField label="Universidad" value={universityFilter} onChange={(value) => setUniversityFilter(value as UniversityFilter)} options={[{ value: "all", label: "Todas" }, { value: "cantuta", label: "La Cantuta" }, { value: "other", label: "Otra / no especificada" }]} />

        <SelectField label="Tipo de ayuda" value={helpTypeFilter} onChange={(value) => setHelpTypeFilter(value as HelpTypeFilter)} options={helpTypeOptions.map((option) => ({ value: option, label: option === "all" ? "Todas" : option }))} />

        <div className="sm:col-span-2 lg:col-span-5">
          <SelectField label="Nivel" value={levelFilter} onChange={(value) => setLevelFilter(value as LevelFilter)} options={[{ value: "all", label: "Todos" }, { value: "Básico", label: "Básico" }, { value: "Intermedio", label: "Intermedio" }, { value: "Avanzado", label: "Avanzado" }]} />
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <p className="px-1 text-xs text-slate-500 sm:text-sm">Mostrando {filteredCompanions.length} compañeros disponibles</p>
          {filteredCompanions.length ? (
            filteredCompanions.map((companion) => {
              const initials = companion.user.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const invitePrepared = preparedInvites.includes(companion.id);

              return (
                <article key={companion.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700">{initials}</div>
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-slate-900">{companion.user.name}</h2>
                        <p className="text-sm text-slate-600">{companion.user.career ?? "Área no especificada"}</p>
                        <p className="text-xs text-slate-500">{companion.user.university ?? "Universidad no especificada"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${companion.canVoice ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {companion.canVoice ? "Disponible con voz" : "Solo texto por ahora"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {companion.topics.map((topic) => (
                      <span key={topic} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{topic}</span>
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-slate-700">{companion.description}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">Disponibilidad: {companion.availability}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <PrimaryButton
                      type="button"
                      onClick={() => {
                        if (!invitePrepared) {
                          setPreparedInvites((prev) => [...prev, companion.id]);
                        }
                      }}
                    >
                      {invitePrepared ? "Invitación preparada" : "Invitar a conversar"}
                    </PrimaryButton>
                    <SecondaryButton type="button" disabled>
                      Ver perfil
                    </SecondaryButton>
                  </div>
                </article>
              );
            })
          ) : (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="text-lg font-bold text-slate-900">No encontramos compañeros</h3>
              <p className="mt-2 text-sm text-slate-600">
                Prueba con otro tema, cambia los filtros o crea una conversación para que otros estudiantes se unan.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton type="button" onClick={() => router.push("/app/conversar/nueva")}>Crear conversación</PrimaryButton>
                <SecondaryButton type="button" onClick={() => router.push("/app/conversar")}>Volver a Conversar</SecondaryButton>
              </div>
            </article>
          )}
        </main>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Temas con más gente disponible</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {trendingTopics.map(([topic, amount]) => (
                <li key={topic} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{topic}</span>
                  <span className="text-xs font-semibold text-slate-500">{amount}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Sugerencias para ti</h3>
            <div className="mt-3 space-y-2">
              {suggestedCompanions.map((companion) => (
                <div key={companion.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{companion.user.name}</p>
                  <p className="text-xs text-slate-500">{companion.topics.slice(0, 2).join(" · ")}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Conversaciones activas ahora</h3>
            <div className="mt-3 space-y-3">
              {activeConversations.map((conversation) => (
                <div key={conversation.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{conversation.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{conversation.category}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {conversation.talkingCount} hablando · {conversation.listeningCount} escuchando
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                    onClick={() =>
                      router.push(
                        conversation.type === "debate" ? `/app/conversar/${conversation.id}/debate` : `/app/conversar/${conversation.id}`,
                      )
                    }
                  >
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-200 focus:ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
