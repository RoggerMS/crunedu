"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
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
  const { accessToken, isAuthenticated } = useAccessToken();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [details, setDetails] = useState("");
  const [openAskForm, setOpenAskForm] = useState(false);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bestAnswer, setBestAnswer] = useState<Record<number, number>>({});
  const [answerVotes, setAnswerVotes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleQuestionImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setQuestionImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleCreateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) return setFormError("Inicia sesión para publicar preguntas.");
    setSubmitting(true);
    setFormError(null);

    try {
      const composedContent = details.trim().length > 0 ? `${content.trim()}\n\nDetalles:\n${details.trim()}` : content.trim();
      await createQuestion({ title: title.trim(), content: composedContent }, accessToken ?? "");
      setTitle("");
      setContent("");
      setDetails("");
      setQuestionImage(null);
      setPreviewUrl(null);
      setOpenAskForm(false);
      await reload();
    } catch (err) {
      setFormError(mapApiError(err, "No se pudo crear la pregunta."));
    } finally {
      setSubmitting(false);
    }
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
        <p className="mt-2 text-slate-600">Un espacio tipo foro para preguntar y responder entre estudiantes, sin mezclarlo con comunidades.</p>
        <div className="mt-4 flex justify-end">
          <PrimaryButton type="button" onClick={() => setOpenAskForm((prev) => !prev)}>{openAskForm ? "Cerrar" : "Preguntar"}</PrimaryButton>
        </div>
      </div>

      {openAskForm ? (
        <form onSubmit={handleCreateQuestion} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-lg font-black">Nueva pregunta</h2>
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Título claro de la pregunta" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Describe tu duda principal" value={content} onChange={(e) => setContent(e.target.value)} required />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Agrega contexto: curso, avance, qué intentaste, datos adicionales" value={details} onChange={(e) => setDetails(e.target.value)} />
          <label className="block text-sm font-medium text-slate-700">
            Foto de apoyo (próximamente se conectará al backend)
            <input type="file" accept="image/*" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" onChange={handleQuestionImage} />
          </label>
          {previewUrl ? <img src={previewUrl} alt="Vista previa de la pregunta" className="max-h-64 rounded-2xl border border-slate-200 object-cover" /> : null}
          {questionImage ? <p className="text-xs text-slate-500">Archivo seleccionado: {questionImage.name}</p> : null}
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button disabled={submitting} className="rounded-2xl bg-brand-600 px-5 py-2 font-semibold text-white disabled:opacity-70">{submitting ? "Publicando..." : "Publicar pregunta"}</button>
        </form>
      ) : null}

      {loading ? <PageState type="loading" title="Cargando preguntas" description="Estamos trayendo nuevas dudas y respuestas para ti." /> : null}
      {error ? <PageState type="error" title="No pudimos cargar las preguntas" description={error} action={<PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>} /> : null}

      <div className="space-y-4">
        {questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold">{question.title}</h3>
            <p className="mt-2 whitespace-pre-line text-slate-700">{question.content}</p>
            <p className="mt-2 text-xs text-slate-500">Por {buildAuthorName(question.author.firstName, question.author.lastName, question.author.email)} · {new Date(question.createdAt).toLocaleString("es-PE")}</p>
            <div className="mt-4 space-y-2">
              {question.answers.map((answer) => {
                const key = `${question.id}-${answer.id}`;
                const votes = answerVotes[key] ?? 0;
                const isBest = bestAnswer[question.id] === answer.id;
                return (
                  <div key={answer.id} className={`rounded-2xl px-3 py-3 text-sm ${isBest ? "border border-emerald-300 bg-emerald-50" : "bg-slate-50"}`}>
                    <p>{answer.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" className="rounded-full border border-slate-300 px-2 py-1 text-xs" onClick={() => setAnswerVotes((prev) => ({ ...prev, [key]: votes + 1 }))}>▲ Útil</button>
                      <button type="button" className="rounded-full border border-slate-300 px-2 py-1 text-xs" onClick={() => setAnswerVotes((prev) => ({ ...prev, [key]: votes - 1 }))}>▼ No útil</button>
                      <span className="text-xs text-slate-500">Votos: {votes}</span>
                      <button type="button" className="rounded-full border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => setBestAnswer((prev) => ({ ...prev, [question.id]: answer.id }))}>{isBest ? "Respuesta marcada" : "Marcar como mejor respuesta"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="flex-1 rounded-2xl border border-slate-300 px-4 py-2" placeholder="Escribe una respuesta" value={answers[question.id] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))} />
              <button onClick={() => handleCreateAnswer(question.id)} className="rounded-2xl bg-slate-900 px-4 py-2 text-white">Responder</button>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && questions.length === 0 ? <PageState type="empty" title="Aún no hay preguntas" description="Publica la primera pregunta para iniciar la conversación." action={<SecondaryButton type="button" onClick={() => setOpenAskForm(true)}>Preguntar ahora</SecondaryButton>} /> : null}
      {hasMore ? <div className="flex justify-center"><button onClick={() => loadMore()} disabled={loadingMore} className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60 sm:w-auto">{loadingMore ? "Cargando más preguntas..." : "Cargar más"}</button></div> : null}
    </section>
  );
}
