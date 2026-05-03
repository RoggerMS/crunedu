"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { debateCourseCatalog } from "@/modules/debates/courseCatalog";
import { debateTaxonomy } from "@/modules/debates/debateTaxonomy";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { Card, EmptyState, PrimaryButton, SecondaryButton, StatusMessage } from "@/components/ui";

type DebateScope = "all" | "academic" | "non-academic";
type DebateWindow = "daily" | "weekly" | "monthly";

type DebateItem = {
  id: number;
  courseKey: string;
  weeklyTopic: string;
  stance: string;
  createdAt: string;
  responses: { id: number }[];
};

function getIsoWeekLabel(date: Date): string {
  const copied = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copied.getUTCDay() || 7;
  copied.setUTCDate(copied.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copied.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copied.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copied.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export default function DebatesPage() {
  const [scope, setScope] = useState<DebateScope>("all");
  const [appliedCourseKeys, setAppliedCourseKeys] = useState<string[]>([]);
  const [appliedSections, setAppliedSections] = useState<string[]>([]);
  const [draftCourseKeys, setDraftCourseKeys] = useState<string[]>([]);
  const [draftSections, setDraftSections] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<DebateWindow>("weekly");
  const [searchTerm, setSearchTerm] = useState("");
  const [debates, setDebates] = useState<DebateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAccessToken();

  const courseSections = useMemo(() => {
    const sections = debateCourseCatalog.filter((item) => (scope === "all" ? true : item.scope === scope));
    return [
      { key: "general", label: "Cursos generales", items: sections.filter((item) => item.section === "general") },
      { key: "specialty", label: "Cursos de especialidad", items: sections.filter((item) => item.section === "specialty") },
      { key: "university", label: "Vida universitaria y otros", items: sections.filter((item) => item.section === "university") },
    ].filter((section) => section.items.length > 0);
  }, [scope]);

  const availableCourses = useMemo(() => courseSections.flatMap((section) => section.items), [courseSections]);

  const visibleCourses = useMemo(() => {
    if (appliedSections.length === 0) return availableCourses;
    return availableCourses.filter((course) => appliedSections.includes(course.section));
  }, [availableCourses, appliedSections]);

  useEffect(() => {
    setAppliedCourseKeys((prev) => prev.filter((key) => availableCourses.some((course) => course.key === key)));
    setAppliedSections((prev) => prev.filter((section) => courseSections.some((item) => item.key === section)));
    setDraftCourseKeys((prev) => prev.filter((key) => availableCourses.some((course) => course.key === key)));
    setDraftSections((prev) => prev.filter((section) => courseSections.some((item) => item.key === section)));
  }, [availableCourses, courseSections]);

  async function loadDebates() {
    const courseKeysToQuery = appliedCourseKeys.length > 0 ? appliedCourseKeys : visibleCourses.map((course) => course.key);
    if (courseKeysToQuery.length === 0) {
      setDebates([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        courseKeysToQuery.map((courseKey) => apiRequest<{ items: DebateItem[] }>(`/debates?courseKey=${encodeURIComponent(courseKey)}`)),
      );
      const merged = responses.flatMap((response) => response.items ?? []);
      const deduped = merged.filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index);
      setDebates(deduped);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar los debates."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDebates();
  }, [appliedCourseKeys, visibleCourses]);

  const filteredDebates = useMemo(() => {
    const now = new Date();
    const currentWeek = getIsoWeekLabel(now);
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return debates
      .filter((debate) => {
        const created = new Date(debate.createdAt);
        if (timeWindow === "daily") return isSameUtcDay(created, now);
        if (timeWindow === "weekly") return getIsoWeekLabel(created) === currentWeek;
        return `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}` === currentMonth;
      })
      .filter((debate) => {
        if (!normalizedQuery) return true;
        const source = `${debate.weeklyTopic} ${debate.stance} ${debate.courseKey}`.toLowerCase();
        return source.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const scoreA = a.responses.length;
        const scoreB = b.responses.length;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [debates, searchTerm, timeWindow]);

  function handleApplyFilters() {
    setAppliedSections(draftSections);
    setAppliedCourseKeys(draftCourseKeys);
    setShowFilters(false);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-black">Debates en tendencia</h1>
        <p className="text-sm text-slate-600">Vista compacta para explorar debates. Haz clic en uno para entrar al detalle completo.</p>

        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md px-3 py-2 text-sm ${scope === "all" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setScope("all")}>Todo</button>
          <button className={`rounded-md px-3 py-2 text-sm ${scope === "academic" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setScope("academic")}>Académico</button>
          <button className={`rounded-md px-3 py-2 text-sm ${scope === "non-academic" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setScope("non-academic")}>No académico</button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <PrimaryButton asChild><Link href="/app/debates/crear">+ Crear debate</Link></PrimaryButton>
          {!isAuthenticated ? <SecondaryButton asChild><Link href="/login">Iniciar sesión</Link></SecondaryButton> : null}
        </div>
      </Card>

      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

      <Card className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar debates por tema, contenido o campo"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-auto" onClick={() => setShowFilters((prev) => !prev)}>
            {showFilters ? "Ocultar filtros" : "Filtros por categorías"}
          </button>
        </div>

        {showFilters ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {courseSections.map((section) => (
                <button key={section.key} onClick={() => setDraftSections((prev) => prev.includes(section.key) ? prev.filter((item) => item !== section.key) : [...prev, section.key])} className={`rounded-full border px-3 py-1 text-sm ${draftSections.includes(section.key) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700"}`}>
                  {section.label}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Categorías disponibles</p>
            <div className="flex flex-wrap gap-2">
              {debateTaxonomy.filter((category) => scope === "all" || category.scope === scope).map((category) => (
                <span key={category.key} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{category.label}</span>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Subcategorías</p>
            {draftSections.length === 0 ? (
              <p className="text-xs text-slate-500">Selecciona primero una categoría para ver sus subcategorías.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableCourses.filter((course) => draftSections.includes(course.section)).map((course) => (
                  <button key={course.key} onClick={() => setDraftCourseKeys((prev) => prev.includes(course.key) ? prev.filter((item) => item !== course.key) : [...prev, course.key])} className={`rounded-full border px-3 py-1 text-sm ${draftCourseKeys.includes(course.key) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700"}`}>
                    {course.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <PrimaryButton type="button" onClick={handleApplyFilters}>Aplicar filtros</PrimaryButton>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "daily" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("daily")}>Debates del día</button>
        <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "weekly" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("weekly")}>Debates de la semana</button>
        <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "monthly" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("monthly")}>Debates del mes</button>
      </div>

      {loading ? <StatusMessage type="loading">Cargando debates...</StatusMessage> : null}
      {!loading && filteredDebates.length === 0 ? <EmptyState title="Sin debates para este rango" description="Cambia de canal o inicia un nuevo debate para activar la conversación." /> : null}

      <div className="space-y-2">
        {filteredDebates.map((debate) => (
          <Link key={debate.id} href={`/app/debates/${debate.id}?courseKey=${encodeURIComponent(debate.courseKey)}`}>
            <Card className="space-y-2 transition hover:border-indigo-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{debate.courseKey}</p>
                  <h3 className="text-base font-bold">{debate.weeklyTopic}</h3>
                </div>
                <p className="whitespace-nowrap text-xs text-slate-500">{new Date(debate.createdAt).toLocaleDateString("es-PE")}</p>
              </div>
              <p className="line-clamp-2 text-sm text-slate-700">{debate.stance}</p>
              <p className="text-xs text-slate-500">{debate.responses.length} respuestas · Entrar al debate</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
