"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { debateCourseCatalog } from "@/modules/debates/courseCatalog";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { Card, EmptyState, PrimaryButton, SecondaryButton, StatusMessage, TextArea } from "@/components/ui";

type DebateCategory = "general" | "specialty" | "extras";

type DebateResponse = {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
};

type DebateItem = {
  id: number;
  courseKey: string;
  weeklyTopic: string;
  stance: string;
  createdAt: string;
  authorId: number;
  responses: DebateResponse[];
};

function getIsoWeekLabel(date: Date): string {
  const copied = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copied.getUTCDay() || 7;
  copied.setUTCDate(copied.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copied.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copied.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copied.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function DebatesPage() {
  const [category, setCategory] = useState<DebateCategory>("general");
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>("comunicacion-academica");
  const [debates, setDebates] = useState<DebateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [weeklyTopic, setWeeklyTopic] = useState("");
  const [stance, setStance] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [replyByDebate, setReplyByDebate] = useState<Record<number, string>>({});
  const [replyLoadingId, setReplyLoadingId] = useState<number | null>(null);
  const { accessToken, isAuthenticated } = useAccessToken();

  const courses = useMemo(() => debateCourseCatalog.filter((item) => item.category === category), [category]);

  useEffect(() => {
    if (!courses.some((course) => course.key === selectedCourseKey)) {
      setSelectedCourseKey(courses[0]?.key ?? "");
    }
  }, [courses, selectedCourseKey]);

  async function loadDebates() {
    if (!selectedCourseKey) return;
    setLoading(true);
    setError(null);
    try {
      const week = getIsoWeekLabel(new Date());
      const data = await apiRequest<{ items: DebateItem[] }>(`/debates?courseKey=${encodeURIComponent(selectedCourseKey)}&week=${week}`);
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

  async function handleReply(debateId: number) {
    const content = replyByDebate[debateId]?.trim() ?? "";
    if (!content) return;
    if (!isAuthenticated) {
      setError("Inicia sesión para responder debates.");
      return;
    }

    setReplyLoadingId(debateId);
    setError(null);
    try {
      await apiRequest(`/debates/${debateId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content }),
      });
      setReplyByDebate((prev) => ({ ...prev, [debateId]: "" }));
      await loadDebates();
    } catch (err) {
      setError(mapApiError(err, "No se pudo responder el debate."));
    } finally {
      setReplyLoadingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-black">Debates por curso</h1>
        <p className="text-sm text-slate-600">Debate sobre cursos generales, de especialidad y temas extra de la vida universitaria.</p>
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md px-3 py-2 text-sm ${category === "general" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setCategory("general")}>Generales</button>
          <button className={`rounded-md px-3 py-2 text-sm ${category === "specialty" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setCategory("specialty")}>Especialidad</button>
          <button className={`rounded-md px-3 py-2 text-sm ${category === "extras" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setCategory("extras")}>Extras</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <button key={course.key} onClick={() => setSelectedCourseKey(course.key)} className={`rounded-lg border p-3 text-left ${selectedCourseKey === course.key ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white"}`}>
              <h2 className="font-medium">{course.label}</h2>
              <p className="text-xs text-slate-500">Clave: {course.key}</p>
            </button>
          ))}
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
            <p className="text-xs text-slate-500">Curso seleccionado: {selectedCourseKey}</p>
            <TextArea value={weeklyTopic} onChange={(event) => setWeeklyTopic(event.target.value)} rows={2} maxLength={160} placeholder="Tema semanal (ej. Semana 1: ecuaciones lineales)" required />
            <TextArea value={stance} onChange={(event) => setStance(event.target.value)} rows={4} maxLength={1500} placeholder="Tu postura u opinión argumentada" required />
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Guardando..." : "Publicar debate"}</PrimaryButton>
          </form>
        </Card>
      ) : null}

      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
      {success ? <StatusMessage type="success">{success}</StatusMessage> : null}

      {loading ? <StatusMessage type="loading">Cargando debates...</StatusMessage> : null}
      {!loading && debates.length === 0 ? <EmptyState title="Sin debates esta semana" description="Sé la primera persona en iniciar un debate para este curso." /> : null}

      <div className="space-y-3">
        {debates.map((debate) => (
          <Card key={debate.id} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{debate.courseKey} · {new Date(debate.createdAt).toLocaleString("es-PE")}</p>
            <h3 className="text-lg font-bold">{debate.weeklyTopic}</h3>
            <p className="text-slate-700">{debate.stance}</p>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold">Respuestas ({debate.responses.length})</p>
              <div className="mt-2 space-y-2">
                {debate.responses.map((response) => (
                  <div key={response.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                    <p>{response.content}</p>
                    <p className="mt-1 text-xs text-slate-500">Usuario #{response.authorId} · {new Date(response.createdAt).toLocaleString("es-PE")}</p>
                  </div>
                ))}
                {debate.responses.length === 0 ? <p className="text-sm text-slate-500">Aún no hay respuestas.</p> : null}
              </div>

              <div className="mt-3 space-y-2">
                <TextArea value={replyByDebate[debate.id] ?? ""} onChange={(event) => setReplyByDebate((prev) => ({ ...prev, [debate.id]: event.target.value }))} rows={2} maxLength={800} placeholder="Escribe tu respuesta al debate" />
                <PrimaryButton type="button" onClick={() => void handleReply(debate.id)} disabled={replyLoadingId === debate.id}>{replyLoadingId === debate.id ? "Enviando..." : "Responder"}</PrimaryButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
