"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
import { QuestionsHeader } from "@/components/questions/QuestionsHeader";
import { CollaboratorRankingCard, GoodQuestionTipsCard, QuestionSubjectsRail, QuestionsSidebar, UserQuestionSummaryCard } from "@/components/questions/QuestionsSidebar";
import { QUESTION_COURSES } from "@/components/questions/question-data";
import { useQuestions } from "@/hooks/useQuestions";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAuth } from "@/providers/auth-provider";
import { createReport, deleteQuestion, mapApiError } from "@/lib/api-helpers";

export default function QuestionsPage() {
  const { questions, toast, notify, loading, error, retry } = useQuestions();
  const { accessToken, isAuthenticated } = useAccessToken();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q")?.trim() ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState("Todas");
  const [course, setCourse] = useState("Todos");

  const myQuestionsCount = questions.filter((q) => q.viewerState.isMine).length;

  const filtered = useMemo(() => {
    const list = questions.filter((q) => {
      const haystack = [q.title, q.description, q.course, q.authorName, q.tags.join(" "), (q.images ?? []).map((f) => f.alt).join(" ")].join(" ").toLowerCase();
      const matchesSearch = search.trim() === "" || haystack.includes(search.toLowerCase());
      const matchesCourse = course === "Todos" || q.course === course;
      return matchesSearch && matchesCourse;
    });
    if (filter === "Sin responder") return list.filter((q) => q.stats.answers === 0);
    if (filter === "Respondidas") return list.filter((q) => q.stats.answers > 0 && q.status !== "resuelta");
    if (filter === "Resueltas") return list.filter((q) => Boolean(q.bestAnswer || q.status === "resuelta"));
    if (filter === "Mis preguntas") return list.filter((q) => q.viewerState.isMine);
    if (filter === "Más recientes") return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [questions, search, course, filter]);

  async function handleDelete(questionId: string) {
    if (!accessToken) return notify("Inicia sesión para eliminar tu pregunta.", "info");
    const confirmed = window.confirm("¿Seguro que deseas eliminar tu pregunta? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    try {
      await deleteQuestion(Number(questionId), accessToken);
      notify("Pregunta eliminada.", "success");
      void retry();
    } catch (err) {
      notify(mapApiError(err, "No se pudo eliminar la pregunta."), "error");
    }
  }

  if (loading) return <section className="mx-auto max-w-[1540px] space-y-4 px-4 py-4 sm:px-6 lg:px-8"><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /><div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]"><div className="hidden h-80 animate-pulse rounded-2xl bg-slate-100 xl:block" /><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-slate-100" /></div></section>;
  if (error) return <section className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8"><p className="mb-2 text-red-600">No se pudieron cargar las preguntas.</p><button className="rounded border px-3 py-2" onClick={() => void retry()}>Reintentar</button></section>;

  return (
    <section className="mx-auto max-w-[1540px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      {toast ? <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-4 xl:block">
          <QuestionSubjectsRail course={course} onCourse={setCourse} />
        </aside>

        <div className="min-w-0 space-y-4">
          <QuestionsHeader
            onAsk={() => router.push("/app/preguntas/nuevo")}
            onUnanswered={() => setFilter("Sin responder")}
            search={search}
            onSearchChange={setSearch}
          />
          <QuestionFilters
            active={filter}
            onChange={(value) => { if (value === "Mis preguntas" && !isAuthenticated) return notify("Inicia sesión para ver tus preguntas.", "info"); setFilter(value); }}
            course={course}
            onCourseChange={setCourse}
            courses={QUESTION_COURSES}
          />
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="font-bold text-slate-900">No hay preguntas todavía</h3>
                <p className="mt-1 text-sm text-slate-600">Sé la primera persona en publicar una duda académica.</p>
                <button onClick={() => router.push("/app/preguntas/nuevo")} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Hacer una pregunta</button>
              </div>
            ) : (
              filtered.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  canReport={isAuthenticated && Number.isFinite(Number(q.id))}
                  onShare={() => { navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${q.id}`); notify("Enlace de pregunta copiado.", "success"); }}
                  onReport={async () => {
                    if (!isAuthenticated || !accessToken) return notify("Inicia sesión para reportar una pregunta.", "info");
                    try {
                      await createReport({ targetType: "QUESTION", targetId: Number(q.id), reason: "Reporte de pregunta" }, accessToken);
                      notify("Reporte enviado.", "success");
                    } catch (reportError) {
                      notify(mapApiError(reportError, "No se pudo enviar el reporte."), "error");
                    }
                  }}
                  onDelete={q.viewerState.isMine ? () => void handleDelete(q.id) : undefined}
                  onRespond={() => router.push(`/app/preguntas/${q.id}`)}
                  onToggleAnswers={() => router.push(`/app/preguntas/${q.id}`)}
                />
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {isAuthenticated && user ? <UserQuestionSummaryCard userName={[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email} questionsCount={myQuestionsCount} /> : null}
          <GoodQuestionTipsCard onInfo={(m) => notify(m, "info")} />
          <CollaboratorRankingCard questions={questions} />
          <QuestionsSidebar
            questions={questions}
            onFeatured={(id) => router.push(`/app/preguntas/${id}`)}
            onCourse={(c) => setCourse(c)}
            onUnanswered={() => setFilter("Sin responder")}
          />
        </aside>
      </div>
    </section>
  );
}
