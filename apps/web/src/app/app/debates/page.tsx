"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { debateCourseCatalog } from "@/modules/debates/courseCatalog";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { Card, EmptyState, PrimaryButton, SecondaryButton, StatusMessage, TextArea } from "@/components/ui";

type DebateScope = "academic" | "non-academic";
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
  const [scope, setScope] = useState<DebateScope>("academic");
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>("comunicacion-academica");
  const [timeWindow, setTimeWindow] = useState<DebateWindow>("weekly");
  const [debates, setDebates] = useState<DebateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [weeklyTopic, setWeeklyTopic] = useState("");
  const [stance, setStance] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { accessToken, isAuthenticated } = useAccessToken();

  const courseSections = useMemo(() => {
    const sections = debateCourseCatalog.filter((item) => item.scope === scope);
    if (scope === "academic") {
      return [
        { key: "general", label: "Cursos generales", items: sections.filter((item) => item.section === "general") },
        { key: "specialty", label: "Cursos de especialidad", items: sections.filter((item) => item.section === "specialty") },
      ];
    }

    return [{ key: "university", label: "Vida universitaria y otros", items: sections }];
  }, [scope]);

  const availableCourses = useMemo(() => courseSections.flatMap((section) => section.items), [courseSections]);

  useEffect(() => {
    if (!availableCourses.some((course) => course.key === selectedCourseKey)) {
      setSelectedCourseKey(availableCourses[0]?.key ?? "");
    }
  }, [availableCourses, selectedCourseKey]);

  async function loadDebates() {
    if (!selectedCourseKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ items: DebateItem[] }>(`/debates?courseKey=${encodeURIComponent(selectedCourseKey)}`);
      setDebates(data.items ?? []);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar los debates."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDebates();
  }, [selectedCourseKey]);

  const filteredDebates = useMemo(() => {
    const now = new Date();
    const currentWeek = getIsoWeekLabel(now);
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    return debates
      .filter((debate) => {
        const created = new Date(debate.createdAt);
        if (timeWindow === "daily") return isSameUtcDay(created, now);
        if (timeWindow === "weekly") return getIsoWeekLabel(created) === currentWeek;
        return `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}` === currentMonth;
      })
      .sort((a, b) => {
        const scoreA = a.responses.length;
        const scoreB = b.responses.length;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [debates, timeWindow]);

  async function handleCreateDebate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setError("Inicia sesión para crear debates.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiRequest("/debates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseKey: selectedCourseKey,
          weeklyTopic,
          stance,
        }),
      });
      setWeeklyTopic("");
      setStance("");
      setSuccess("Debate creado correctamente.");
      setIsCreateOpen(false);
      await loadDebates();
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear el debate."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-black">Debates en tendencia</h1>
        <p className="text-sm text-slate-600">Vista compacta para explorar debates. Haz clic en uno para entrar al detalle completo.</p>

        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md px-3 py-2 text-sm ${scope === "academic" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setScope("academic")}>Académico</button>
          <button className={`rounded-md px-3 py-2 text-sm ${scope === "non-academic" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setScope("non-academic")}>No académico</button>
        </div>

        <div className="space-y-2">
          {courseSections.map((section) => (
            <details key={section.key} open className="rounded-xl border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">{section.label}</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {section.items.map((course) => (
                  <button key={course.key} onClick={() => setSelectedCourseKey(course.key)} className={`rounded-full border px-3 py-1 text-sm ${selectedCourseKey === course.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700"}`}>
                    {course.label}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "daily" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("daily")}>Debates del día</button>
          <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "weekly" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("weekly")}>Debates de la semana</button>
          <button className={`rounded-md px-3 py-2 text-sm ${timeWindow === "monthly" ? "bg-indigo-600 text-white" : "bg-gray-100"}`} onClick={() => setTimeWindow("monthly")}>Debates del mes</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={() => setIsCreateOpen((prev) => !prev)}>{isCreateOpen ? "Cerrar" : "Crear debate"}</PrimaryButton>
          {!isAuthenticated ? <SecondaryButton asChild><Link href="/login">Iniciar sesión</Link></SecondaryButton> : null}
        </div>
      </Card>

      {isCreateOpen ? (
        <Card>
          <form className="space-y-3" onSubmit={handleCreateDebate}>
            <h2 className="text-lg font-black">Nuevo debate</h2>
            <p className="text-xs text-slate-500">Canal seleccionado: {selectedCourseKey}</p>
            <TextArea value={weeklyTopic} onChange={(event) => setWeeklyTopic(event.target.value)} rows={2} maxLength={160} placeholder="Título o tema del debate" required />
            <TextArea value={stance} onChange={(event) => setStance(event.target.value)} rows={4} maxLength={1500} placeholder="Describe tu postura y los argumentos iniciales" required />
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Guardando..." : "Publicar debate"}</PrimaryButton>
          </form>
        </Card>
      ) : null}

      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      {success ? <StatusMessage type="success">{success}</StatusMessage> : null}

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
