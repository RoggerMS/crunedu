"use client";

import { FormEvent, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { useQuestions } from "@/hooks/useQuestions";
import { PageState, PrimaryButton, SecondaryButton } from "@/components/ui";
import { createAnswer, createQuestion } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

function buildAuthorName(firstName: string | null, lastName: string | null, email: string) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : email;
}

export default function QuestionsPage() {
  const { questions, loading, loadingMore, hasMore, error, reload, loadMore } = useQuestions();
  const { communities } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) return setFormError("Inicia sesión para publicar preguntas.");
    setSubmitting(true);
    setFormError(null);

    try {
      await createQuestion({ title: title.trim(), content: content.trim(), communityId: communityId ? Number(communityId) : undefined }, accessToken ?? "");
      setTitle(""); setContent(""); setCommunityId("");
      await reload();
    } catch (err) {
      setFormError(mapApiError(err, "No se pudo crear la pregunta."));
    } finally { setSubmitting(false); }
  }

  async function handleCreateAnswer(questionId: number) {
    if (!isAuthenticated) return;
    const text = answers[questionId]?.trim();
    if (!text) return;
    await createAnswer(questionId, text, accessToken ?? "");
    setAnswers((prev) => ({ ...prev, [questionId]: "" }));
    await reload();
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Preguntas y respuestas</h1>
        <p className="mt-2 text-slate-600">Comparte tus dudas y ayuda a otros estudiantes.</p>
      </div>

      <form onSubmit={handleCreateQuestion} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-black">Publicar una pregunta</h2>
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Título de la pregunta" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Describe tu duda" value={content} onChange={(e) => setContent(e.target.value)} />
        <select className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={communityId} onChange={(e) => setCommunityId(e.target.value)}>
          <option value="">Selecciona una comunidad (opcional)</option>
          {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
        </select>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <button disabled={submitting} className="rounded-2xl bg-brand-600 px-5 py-2 font-semibold text-white disabled:opacity-70">{submitting ? "Publicando..." : "Publicar pregunta"}</button>
      </form>

      {loading ? (
        <PageState type="loading" title="Cargando preguntas" description="Estamos trayendo nuevas dudas y respuestas para ti." />
      ) : null}
      {error ? (
        <PageState
          type="error"
          title="No pudimos cargar las preguntas"
          description={error}
          action={<PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>}
        />
      ) : null}

      <div className="space-y-4">
        {questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold">{question.title}</h3>
            <p className="mt-2 text-slate-700">{question.content}</p>
            <p className="mt-2 text-xs text-slate-500">Por {buildAuthorName(question.author.firstName, question.author.lastName, question.author.email)} · {new Date(question.createdAt).toLocaleString("es-PE")}</p>
            <div className="mt-4 space-y-2">
              {question.answers.map((answer) => <p key={answer.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">{answer.content}</p>)}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="flex-1 rounded-2xl border border-slate-300 px-4 py-2" placeholder="Escribe una respuesta" value={answers[question.id] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))} />
              <button onClick={() => handleCreateAnswer(question.id)} className="rounded-2xl bg-slate-900 px-4 py-2 text-white">Responder</button>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && questions.length === 0 ? (
        <PageState
          type="empty"
          title="Aún no hay preguntas"
          description="Publica la primera pregunta para iniciar la conversación."
          action={<SecondaryButton type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Publicar ahora</SecondaryButton>}
        />
      ) : null}
      {hasMore ? (
        <div className="flex justify-center">
          <button onClick={() => loadMore()} disabled={loadingMore} className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60 sm:w-auto">
            {loadingMore ? "Cargando más preguntas..." : "Cargar más"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
