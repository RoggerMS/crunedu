"use client";

import Link from "next/link";
import { useQuestions } from "@/hooks/useQuestions";
import { PageState, PrimaryButton } from "@/components/ui";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
}

export default function QuestionsPage() {
  const { questions, loading, loadingMore, hasMore, error, reload, loadMore } = useQuestions();

  const questionsByCategory = questions.reduce<Record<string, typeof questions>>((acc, question) => {
    const key = question.community?.name ?? "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(question);
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Preguntas</h1>
        <p className="mt-2 text-slate-600">Foro educativo para resolver tareas y dudas paso a paso.</p>
        <div className="mt-4 flex justify-end">
          <Link href="/app/preguntas/nuevo" target="_blank" rel="noopener noreferrer">
            <PrimaryButton type="button">Preguntar</PrimaryButton>
          </Link>
        </div>
      </div>

      {loading ? <PageState type="loading" title="Cargando preguntas" description="Estamos trayendo dudas recientes por categoría." /> : null}
      {error ? <PageState type="error" title="No pudimos cargar las preguntas" description={error} action={<PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>} /> : null}

      {!loading && !error ? (
        <div className="space-y-5">
          {Object.entries(questionsByCategory).map(([category, items]) => (
            <section key={category} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black">{category}</h2>
              <div className="mt-3 space-y-3">
                {items.map((question) => (
                  <Link key={question.id} href={`/app/preguntas/${question.id}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                    <h3 className="font-semibold text-slate-900">{question.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">{question.content}</p>
                    <p className="mt-2 text-xs text-slate-500">Por {buildAuthorName(question.author.firstName, question.author.lastName, question.author.email)} · {question.answersCount} respuestas</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!loading && !error && questions.length === 0 ? <PageState type="empty" title="Aún no hay preguntas" description="Publica la primera pregunta para iniciar la ayuda entre estudiantes." /> : null}
      {hasMore ? <div className="flex justify-center"><button onClick={() => loadMore()} disabled={loadingMore} className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60 sm:w-auto">{loadingMore ? "Cargando más preguntas..." : "Cargar más"}</button></div> : null}
    </section>
  );
}
